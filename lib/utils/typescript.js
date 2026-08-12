import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

/**
 * Load tsconfig.json if it exists
 * @param {string} tsConfigPath - Path to tsconfig.json
 * @returns {object|null} - Parsed tsconfig or null
 */
function loadTsConfig(tsConfigPath) {
  if (!fs.existsSync(tsConfigPath)) {
    return null
  }

  try {
    const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf8')
    return JSON.parse(tsConfigContent)
  } catch (err) {
    return null
  }
}

/**
 * Resolve TypeScript path alias to actual file path
 * @param {string} importPath - Import path with alias (e.g., '#config/urls')
 * @param {object} tsConfig - Parsed tsconfig.json
 * @param {string} configDir - Directory containing tsconfig.json
 * @returns {string|null} - Resolved file path or null if not an alias
 */
function resolveTsPathAlias(importPath, tsConfig, configDir) {
  if (!tsConfig || !tsConfig.compilerOptions || !tsConfig.compilerOptions.paths) {
    return null
  }

  const paths = tsConfig.compilerOptions.paths

  for (const [pattern, targets] of Object.entries(paths)) {
    if (!targets || targets.length === 0) {
      continue
    }

    const patternRegex = new RegExp(
      '^' + pattern.replace(/\*/g, '(.*)') + '$'
    )
    const match = importPath.match(patternRegex)

    if (match) {
      const wildcard = match[1] || ''
      const target = targets[0]
      const resolvedTarget = target.replace(/\*/g, wildcard)

      return path.resolve(configDir, resolvedTarget)
    }
  }

  return null
}

/**
 * Transpile TypeScript files to ES modules with CommonJS shim support
 * Handles recursive transpilation of imported TypeScript files
 *
 * @param {string} mainFilePath - Path to the main TypeScript file to transpile
 * @param {object} typescript - TypeScript compiler instance
 * @returns {Promise<{tempFile: string, allTempFiles: string[], fileMapping: any}>} - Main temp file and all temp files created
 */
export async function transpileTypeScript(mainFilePath, typescript) {
  const { transpile } = typescript

  /**
   * Transpile a single TypeScript file to JavaScript
   * Injects CommonJS shims (require, module, exports, __dirname, __filename) as needed
   */
  const transpileTS = (filePath) => {
    const tsContent = fs.readFileSync(filePath, 'utf8')

    // Transpile TypeScript to JavaScript with ES module output
    let jsContent = transpile(tsContent, {
      module: 99, // ModuleKind.ESNext
      target: 99, // ScriptTarget.ESNext
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      lib: ['lib.esnext.d.ts'], // Enable latest features including top-level await
      suppressOutputPathCheck: true,
      skipLibCheck: true,
    })

    // Check if the code uses CommonJS globals.
    //
    // A bare `require` or `module` identifier counts, not just `require(...)` and
    // `module.exports`: `if (require.main === module)` is the standard entrypoint idiom,
    // and without a shim the transpiled file throws "require is not defined in ES module
    // scope". Quoted occurrences (`from 'module'`) are specifiers, not references. A file
    // that declares its own binding is left alone, so the shim can never redeclare it.
    const references = name => new RegExp(`(?<!['"\`])\\b${name}\\b(?!['"\`])`).test(jsContent)
    const declaresOwn = name => new RegExp(`\\b(?:const|let|var|function|class)\\s+${name}\\b|\\bimport\\s+${name}\\b`).test(jsContent)
    const needsShim = name => references(name) && !declaresOwn(name)

    const usesCommonJSGlobals = /__dirname|__filename/.test(jsContent)
    const usesRequire = needsShim('require')
    const usesModule = needsShim('module')
    const usesModuleExports = /\b(module\.exports|exports\.)/.test(jsContent)

    if (usesCommonJSGlobals || usesRequire || usesModule || usesModuleExports) {
      // Inject ESM equivalents at the top of the file
      let esmGlobals = ''

      if (usesRequire) {
        // IMPORTANT: Use the original .ts file path as the base for require()
        // This ensures dynamic require() calls work with relative paths from the original file location
        const originalFileUrl = `file://${filePath.replace(/\\/g, '/')}`
        esmGlobals += `import { createRequire } from 'module';
import { extname as __extname } from 'path';
const __baseRequire = createRequire('${originalFileUrl}');

// Wrap require to auto-resolve extensions (mimics CommonJS behavior)
const require = (id) => {
  try {
    return __baseRequire(id);
  } catch (err) {
    // If module not found and it's a relative/absolute path without extension, try common extensions
    if (err.code === 'MODULE_NOT_FOUND' && (id.startsWith('./') || id.startsWith('../') || id.startsWith('/'))) {
      const ext = __extname(id);
      // Only treat known file extensions as real extensions (so names like .TEST don't block probing)
      const __knownExts = ['.js', '.cjs', '.mjs', '.json', '.node'];
      const hasKnownExt = ext && __knownExts.includes(ext.toLowerCase());
      if (!hasKnownExt) {
        // Try common extensions in order: .js, .cjs, .json, .node
        // Note: .ts files cannot be required - they need transpilation first
        const extensions = ['.js', '.cjs', '.json', '.node'];
        for (const testExt of extensions) {
          try {
            return __baseRequire(id + testExt);
          } catch (e) {
            // Continue to next extension
          }
        }
      }
    }
    // Re-throw original error if all attempts failed
    throw err;
  }
};

`
      }

      if (usesModule || usesModuleExports) {
        esmGlobals += `const module = { exports: {} };
const exports = module.exports;

`
      }

      if (usesCommonJSGlobals) {
        // For __dirname and __filename, also use the original file path
        const originalFileUrl = `file://${filePath.replace(/\\/g, '/')}`
        esmGlobals += `import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirname_fn } from 'path';
const __filename = '${filePath.replace(/\\/g, '/')}';
const __dirname = __dirname_fn(__filename);

`
      }

      jsContent = esmGlobals + jsContent

      // If module.exports is used, we need to export it as default
      if (usesModuleExports) {
        jsContent += `\nexport default module.exports;\n`
      }
    }

    return jsContent
  }

  // Create a map to track transpiled files
  const transpiledFiles = new Map()
  const baseDir = path.dirname(mainFilePath)

  // Try to find tsconfig.json by walking up the directory tree
  let tsConfigPath = path.join(baseDir, 'tsconfig.json')
  let configDir = baseDir
  let searchDir = baseDir

  while (!fs.existsSync(tsConfigPath) && searchDir !== path.dirname(searchDir)) {
    searchDir = path.dirname(searchDir)
    tsConfigPath = path.join(searchDir, 'tsconfig.json')
    if (fs.existsSync(tsConfigPath)) {
      configDir = searchDir
      break
    }
  }

  const tsConfig = loadTsConfig(tsConfigPath)

  // Recursive function to transpile a file and all its TypeScript dependencies
  const transpileFileAndDeps = (filePath) => {
    // Already transpiled, skip
    if (transpiledFiles.has(filePath)) {
      return
    }

    // Transpile this file
    let jsContent = transpileTS(filePath)

    // Find all TypeScript imports in this file (static imports, dynamic import() and require() calls)
    const importRegex = /from\s+['"]([^'"]+?)['"]/g
    const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"]+?)['"]\s*\)/g
    const requireRegex = /require\s*\(\s*['"]([^'"]+?)['"]\s*\)/g
    let match
    const imports = []

    while ((match = importRegex.exec(jsContent)) !== null) {
      imports.push({ path: match[1], type: 'import' })
    }

    while ((match = dynamicImportRegex.exec(jsContent)) !== null) {
      imports.push({ path: match[1], type: 'import' })
    }

    while ((match = requireRegex.exec(jsContent)) !== null) {
      imports.push({ path: match[1], type: 'require' })
    }

    // Get the base directory for this file
    const fileBaseDir = path.dirname(filePath)

    // Recursively transpile each imported TypeScript file
    for (const { path: importPath } of imports) {
      let importedPath = importPath

      // Check if this is a path alias
      const resolvedAlias = resolveTsPathAlias(importPath, tsConfig, configDir)
      if (resolvedAlias) {
        importedPath = resolvedAlias
      } else if (importPath.startsWith('.')) {
        importedPath = path.resolve(fileBaseDir, importPath)
      } else {
        continue
      }

      // Handle .js extensions that might actually be .ts files
      if (importedPath.endsWith('.js')) {
        const tsVersion = importedPath.replace(/\.js$/, '.ts')
        if (fs.existsSync(tsVersion)) {
          importedPath = tsVersion
        }
      }

      // Check for standard module extensions to determine if we should try adding .ts
      const ext = path.extname(importedPath)
      const standardExtensions = ['.js', '.mjs', '.cjs', '.json', '.node']
      const hasStandardExtension = standardExtensions.includes(ext.toLowerCase())

      // If it doesn't end with .ts and doesn't have a standard extension, try adding .ts
      if (!importedPath.endsWith('.ts') && !hasStandardExtension) {
        const tsPath = importedPath + '.ts'
        if (fs.existsSync(tsPath)) {
          importedPath = tsPath
        } else {
          // Try index.ts for directory imports
          const indexTsPath = path.join(importedPath, 'index.ts')
          if (fs.existsSync(indexTsPath)) {
            importedPath = indexTsPath
          } else {
            // Try .js extension as well
            const jsPath = importedPath + '.js'
            if (fs.existsSync(jsPath)) {
              // Skip .js files, they don't need transpilation
              continue
            }
          }
        }
      }

      // If it's a TypeScript file, recursively transpile it and its dependencies
      if (importedPath.endsWith('.ts') && fs.existsSync(importedPath)) {
        transpileFileAndDeps(importedPath)
      }
    }

    // Resolve one ESM specifier to the temp file its source was transpiled into.
    // Returns null when the specifier must be left untouched — bare package names,
    // or paths that resolve to nothing we emitted.
    const resolveEsmSpecifier = importPath => {
      let resolvedPath = importPath
      const originalExt = path.extname(importPath)

      // Check if this is a path alias
      const resolvedAlias = resolveTsPathAlias(importPath, tsConfig, configDir)
      if (resolvedAlias) {
        resolvedPath = resolvedAlias
      } else if (importPath.startsWith('.')) {
        resolvedPath = path.resolve(fileBaseDir, importPath)
      } else {
        return null
      }

      const toRelative = tempFile => {
        const relPath = path.relative(fileBaseDir, tempFile).replace(/\\/g, '/')
        return relPath.startsWith('.') ? relPath : `./${relPath}`
      }

      // If resolved path is a directory, try index.ts
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        const indexPath = path.join(resolvedPath, 'index.ts')
        if (fs.existsSync(indexPath) && transpiledFiles.has(indexPath)) {
          return toRelative(transpiledFiles.get(indexPath))
        }
      }

      // Handle .js extension that might be .ts
      if (resolvedPath.endsWith('.js')) {
        const tsVersion = resolvedPath.replace(/\.js$/, '.ts')
        return transpiledFiles.has(tsVersion) ? toRelative(transpiledFiles.get(tsVersion)) : null
      }

      // Try with .ts extension
      const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : resolvedPath + '.ts'
      if (transpiledFiles.has(tsPath)) {
        return toRelative(transpiledFiles.get(tsPath))
      }

      // Try index.ts for directory imports
      const indexTsPath = path.join(resolvedPath, 'index.ts')
      if (transpiledFiles.has(indexTsPath)) {
        return toRelative(transpiledFiles.get(indexTsPath))
      }

      // If the import doesn't have a standard module extension, add .js for ESM compatibility
      const standardExtensions = ['.js', '.mjs', '.cjs', '.json', '.node']
      if (!standardExtensions.includes(originalExt.toLowerCase())) {
        return `${importPath}.js`
      }

      return null
    }

    // After all dependencies are transpiled, rewrite imports in this file
    jsContent = jsContent.replace(/from\s+['"]([^'"]+?)['"]/g, (match, importPath) => {
      const resolved = resolveEsmSpecifier(importPath)
      return resolved === null ? match : `from '${resolved}'`
    })

    // Dynamic import() resolves exactly like a static import. Without this rewrite,
    // `await import('./module')` survives transpilation still pointing at a `.ts` file
    // that was never emitted, and fails with ERR_MODULE_NOT_FOUND at runtime.
    jsContent = jsContent.replace(/(\bimport\s*\(\s*)['"]([^'"]+?)['"](\s*\))/g, (match, open, importPath, close) => {
      const resolved = resolveEsmSpecifier(importPath)
      return resolved === null ? match : `${open}'${resolved}'${close}`
    })

    // Also rewrite require() calls to point to transpiled TypeScript files
    jsContent = jsContent.replace(
      /require\s*\(\s*['"]([^'"]+?)['"]\s*\)/g,
      (match, requirePath) => {
        let resolvedPath = requirePath

        // Check if this is a path alias
        const resolvedAlias = resolveTsPathAlias(requirePath, tsConfig, configDir)
        if (resolvedAlias) {
          resolvedPath = resolvedAlias
        } else if (requirePath.startsWith('.')) {
          resolvedPath = path.resolve(fileBaseDir, requirePath)
        } else {
          return match
        }

        // Handle .js extension that might be .ts
        if (resolvedPath.endsWith('.js')) {
          const tsVersion = resolvedPath.replace(/\.js$/, '.ts')
          if (transpiledFiles.has(tsVersion)) {
            const tempFile = transpiledFiles.get(tsVersion)
            const relPath = path.relative(fileBaseDir, tempFile).replace(/\\/g, '/')
            const finalPath = relPath.startsWith('.') ? relPath : './' + relPath
            return `require('${finalPath}')`
          }
          return match
        }

        // Try with .ts extension
        const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : resolvedPath + '.ts'

        // If we transpiled this file, use the temp file
        if (transpiledFiles.has(tsPath)) {
          const tempFile = transpiledFiles.get(tsPath)
          const relPath = path.relative(fileBaseDir, tempFile).replace(/\\/g, '/')
          const finalPath = relPath.startsWith('.') ? relPath : './' + relPath
          return `require('${finalPath}')`
        }

        // Otherwise, keep the require as-is
        return match
      }
    )

    // Write the transpiled file with updated imports
    // Include process.pid + a random suffix so concurrent run-multiple workers
    // don't write to and delete each other's temp files (see issue #5642).
    const tempFile = filePath.replace(/\.ts$/, `.${process.pid}.${Math.random().toString(36).slice(2, 10)}.temp.mjs`)
    fs.writeFileSync(tempFile, jsContent)
    transpiledFiles.set(filePath, tempFile)
  }

  // Start recursive transpilation from the main file
  transpileFileAndDeps(mainFilePath)

  // Get the main transpiled file
  const tempJsFile = transpiledFiles.get(mainFilePath)

  // Convert to file:// URL for dynamic import() (required on Windows)
  const tempFileUrl = pathToFileURL(tempJsFile).href

  // Store all temp files for cleanup (keep as paths, not URLs)
  const allTempFiles = Array.from(transpiledFiles.values())

  return { tempFile: tempFileUrl, allTempFiles, fileMapping: transpiledFiles }
}

/**
 * Map error stack traces from temp .mjs files back to original .ts files
 * @param {Error} error - The error object to fix
 * @param {Map<string, string>} fileMapping - Map of original .ts files to temp .mjs files
 * @returns {Error} - Error with fixed stack trace
 */
export function fixErrorStack(error, fileMapping) {
  if (!error.stack || !fileMapping) return error

  let stack = error.stack

  // Create reverse mapping (temp.mjs -> original.ts)
  const reverseMap = new Map()
  for (const [tsFile, mjsFile] of fileMapping.entries()) {
    reverseMap.set(mjsFile, tsFile)
  }

  // Replace all temp.mjs references with original .ts files
  for (const [mjsFile, tsFile] of reverseMap.entries()) {
    const mjsPattern = mjsFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    stack = stack.replace(new RegExp(mjsPattern, 'g'), tsFile)
  }

  error.stack = stack
  return error
}

/**
 * Clean up temporary transpiled files
 * @param {string[]} tempFiles - Array of temp file paths to delete
 */
export function cleanupTempFiles(tempFiles) {
  for (const file of tempFiles) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file)
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
}
