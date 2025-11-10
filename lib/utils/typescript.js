import fs from 'fs'
import path from 'path'

/**
 * Transpile TypeScript files to ES modules with CommonJS shim support
 * Handles recursive transpilation of imported TypeScript files
 * 
 * @param {string} mainFilePath - Path to the main TypeScript file to transpile
 * @param {object} typescript - TypeScript compiler instance
 * @returns {Promise<{tempFile: string, allTempFiles: string[]}>} - Main temp file and all temp files created
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
    
    // Check if the code uses CommonJS globals
    const usesCommonJSGlobals = /__dirname|__filename/.test(jsContent)
    const usesRequire = /\brequire\s*\(/.test(jsContent)
    const usesModuleExports = /\b(module\.exports|exports\.)/.test(jsContent)
    
    if (usesCommonJSGlobals || usesRequire || usesModuleExports) {
      // Inject ESM equivalents at the top of the file
      let esmGlobals = ''
      
      if (usesRequire || usesModuleExports) {
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

const module = { exports: {} };
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
  
  // Recursive function to transpile a file and all its TypeScript dependencies
  const transpileFileAndDeps = (filePath) => {
    // Already transpiled, skip
    if (transpiledFiles.has(filePath)) {
      return
    }
    
    // Transpile this file
    let jsContent = transpileTS(filePath)
    
    // Find all relative TypeScript imports in this file
    const importRegex = /from\s+['"](\..+?)(?:\.ts)?['"]/g
    let match
    const imports = []
    
    while ((match = importRegex.exec(jsContent)) !== null) {
      imports.push(match[1])
    }
    
    // Get the base directory for this file
    const fileBaseDir = path.dirname(filePath)
    
    // Recursively transpile each imported TypeScript file
    for (const relativeImport of imports) {
      let importedPath = path.resolve(fileBaseDir, relativeImport)
      
      // Handle .js extensions that might actually be .ts files
      if (importedPath.endsWith('.js')) {
        const tsVersion = importedPath.replace(/\.js$/, '.ts')
        if (fs.existsSync(tsVersion)) {
          importedPath = tsVersion
        }
      }
      
      // Try adding .ts extension if file doesn't exist and no extension provided
      if (!path.extname(importedPath)) {
        const tsPath = importedPath + '.ts'
        if (fs.existsSync(tsPath)) {
          importedPath = tsPath
        } else {
          // Try .js extension as well
          const jsPath = importedPath + '.js'
          if (fs.existsSync(jsPath)) {
            // Skip .js files, they don't need transpilation
            continue
          }
        }
      }
      
      // If it's a TypeScript file, recursively transpile it and its dependencies
      if (importedPath.endsWith('.ts') && fs.existsSync(importedPath)) {
        transpileFileAndDeps(importedPath)
      }
    }
    
    // After all dependencies are transpiled, rewrite imports in this file
    jsContent = jsContent.replace(
      /from\s+['"](\..+?)(?:\.ts)?['"]/g,
      (match, importPath) => {
        let resolvedPath = path.resolve(fileBaseDir, importPath)
        
        // Handle .js extension that might be .ts
        if (resolvedPath.endsWith('.js')) {
          const tsVersion = resolvedPath.replace(/\.js$/, '.ts')
          if (transpiledFiles.has(tsVersion)) {
            const tempFile = transpiledFiles.get(tsVersion)
            const relPath = path.relative(fileBaseDir, tempFile).replace(/\\/g, '/')
            // Ensure the path starts with ./
            if (!relPath.startsWith('.')) {
              return `from './${relPath}'`
            }
            return `from '${relPath}'`
          }
        }
        
        // Try with .ts extension
        const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : resolvedPath + '.ts'
        
        // If we transpiled this file, use the temp file
        if (transpiledFiles.has(tsPath)) {
          const tempFile = transpiledFiles.get(tsPath)
          const relPath = path.relative(fileBaseDir, tempFile).replace(/\\/g, '/')
          // Ensure the path starts with ./
          if (!relPath.startsWith('.')) {
            return `from './${relPath}'`
          }
          return `from '${relPath}'`
        }
        
        // Otherwise, keep the import as-is
        return match
      }
    )
    
    // Write the transpiled file with updated imports
    const tempFile = filePath.replace(/\.ts$/, '.temp.mjs')
    fs.writeFileSync(tempFile, jsContent)
    transpiledFiles.set(filePath, tempFile)
  }
  
  // Start recursive transpilation from the main file
  transpileFileAndDeps(mainFilePath)
  
  // Get the main transpiled file
  const tempJsFile = transpiledFiles.get(mainFilePath)
  
  // Store all temp files for cleanup
  const allTempFiles = Array.from(transpiledFiles.values())
  
  return { tempFile: tempJsFile, allTempFiles }
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
