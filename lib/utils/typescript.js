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
const require = createRequire('${originalFileUrl}');
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
  
  // Transpile main file
  let jsContent = transpileTS(mainFilePath)
  
  // Find and transpile all relative TypeScript imports
  // Match: import ... from './file' or '../file' or './file.ts'
  const importRegex = /from\s+['"](\..+?)(?:\.ts)?['"]/g
  let match
  const imports = []
  
  while ((match = importRegex.exec(jsContent)) !== null) {
    imports.push(match[1])
  }
  
  // Transpile each imported TypeScript file
  for (const relativeImport of imports) {
    let importedPath = path.resolve(baseDir, relativeImport)
    
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
    
    // If it's a TypeScript file, transpile it
    if (importedPath.endsWith('.ts') && fs.existsSync(importedPath)) {
      const transpiledImportContent = transpileTS(importedPath)
      const tempImportFile = importedPath.replace(/\.ts$/, '.temp.mjs')
      fs.writeFileSync(tempImportFile, transpiledImportContent)
      transpiledFiles.set(importedPath, tempImportFile)
    }
  }
  
  // Replace imports in the main file to point to temp .mjs files
  jsContent = jsContent.replace(
    /from\s+['"](\..+?)(?:\.ts)?['"]/g,
    (match, importPath) => {
      let resolvedPath = path.resolve(baseDir, importPath)
      
      // Handle .js extension that might be .ts
      if (resolvedPath.endsWith('.js')) {
        const tsVersion = resolvedPath.replace(/\.js$/, '.ts')
        if (transpiledFiles.has(tsVersion)) {
          const tempFile = transpiledFiles.get(tsVersion)
          const relPath = path.relative(baseDir, tempFile).replace(/\\/g, '/')
          return `from './${relPath}'`
        }
      }
      
      // Try with .ts extension
      const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : resolvedPath + '.ts'
      
      // If we transpiled this file, use the temp file
      if (transpiledFiles.has(tsPath)) {
        const tempFile = transpiledFiles.get(tsPath)
        // Get relative path from main temp file to this temp file
        const relPath = path.relative(baseDir, tempFile).replace(/\\/g, '/')
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

  // Create a temporary JS file with .mjs extension for the main file
  const tempJsFile = mainFilePath.replace(/\.ts$/, '.temp.mjs')
  fs.writeFileSync(tempJsFile, jsContent)
  
  // Store all temp files for cleanup
  const allTempFiles = [tempJsFile, ...Array.from(transpiledFiles.values())]
  
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
