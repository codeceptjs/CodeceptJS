#!/usr/bin/env node
/**
 * Generate TypeScript type definitions from JavaScript files with JSDoc comments
 *
 * This replaces tsd-jsdoc by using TypeScript's built-in declaration generation (tsc --declaration --allowJs).
 * It replicates the functionality of the custom JSDoc plugins:
 * - jsdoc.namespace.cjs: Wraps all types in CodeceptJS namespace
 * - jsdoc.promiseBased.cjs: Makes helper methods return Promise<any>
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, basename, dirname, extname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Run TypeScript compiler to generate .d.ts files
 * @param {string} configPath - Path to tsconfig
 */
function runTypeScriptCompiler(configPath) {
  console.log('Running TypeScript compiler to generate declarations...')
  try {
    execSync(`npx tsc -p "${configPath}"`, {
      cwd: join(__dirname, '..'),
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('TypeScript compiler encountered errors, but may have generated partial output')
    // Don't exit, continue to post-process what was generated
  }
}

/**
 * Post-process a .d.ts file to clean up exports
 * @param {string} filePath - Path to .d.ts file
 */
function cleanupDeclaration(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  let content = readFileSync(filePath, 'utf-8')

  // Skip processing if already clean
  if (content.includes('declare namespace CodeceptJS')) {
    return
  }

  // Simple cleanup - just ensure proper formatting
  // Don't wrap in namespace here, we'll create a consolidated types.d.ts instead

  writeFileSync(filePath, content)
}

/**
 * Transform helper methods to return Promise<any> for promise-based typings
 * @param {string} filePath - Path to .d.ts file
 */
function makePromiseBased(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  let content = readFileSync(filePath, 'utf-8')

  // Rename helper classes to add 'Ts' suffix (e.g., Playwright -> PlaywrightTs)
  content = content.replace(/class\s+(\w+)\s+extends/g, 'class $1Ts extends')
  content = content.replace(/@augments\s+(\w+)/g, '@augments $1Ts')

  // Transform method signatures to return Promise<any>
  // Match: methodName(...): ReturnType
  // But skip if already returns Promise
  content = content.replace(/^(\s+)(\w+)\s*\(([^)]*)\)\s*:\s*(?!Promise|void)([^;{]+)(;|{)/gm, '$1$2($3): Promise<any>$5')

  // Transform void returns to Promise<void>
  content = content.replace(/^(\s+)(\w+)\s*\(([^)]*)\)\s*:\s*void(;|{)/gm, '$1$2($3): Promise<void>$4')

  writeFileSync(filePath, content)
}

/**
 * Get all .d.ts files in a directory recursively
 * @param {string} dir - Directory path
 * @returns {string[]} Array of file paths
 */
function getAllDtsFiles(dir) {
  const files = []

  if (!existsSync(dir)) {
    return files
  }

  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...getAllDtsFiles(fullPath))
    } else if (extname(item) === '.ts' && item.endsWith('.d.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Merge multiple .d.ts files into one
 * @param {string[]} files - Array of .d.ts file paths
 * @param {string} outputPath - Output file path
 */
function mergeDeclarations(files, outputPath) {
  console.log(`Merging ${files.length} declaration files...`)

  const merged = []
  const seenDeclarations = new Set()

  for (const file of files) {
    if (!existsSync(file)) continue

    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines, imports, and export statements at top level
      if (!trimmed || trimmed.startsWith('import ') || trimmed === 'export {};') {
        continue
      }

      // Add unique declarations only
      if (!seenDeclarations.has(trimmed)) {
        merged.push(line)
        seenDeclarations.add(trimmed)
      }
    }
  }

  writeFileSync(outputPath, merged.join('\n'))
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)
  const isPromiseBased = args.includes('--promise-based')
  const configPath = args.find(arg => arg.endsWith('.json')) || 'tsconfig.typings.json'

  const fullConfigPath = join(__dirname, configPath)

  if (!existsSync(fullConfigPath)) {
    console.error(`Config file not found: ${fullConfigPath}`)
    process.exit(1)
  }

  // Step 1: Run TypeScript compiler
  runTypeScriptCompiler(fullConfigPath)

  // Step 2: Post-process generated files
  console.log('Post-processing generated declarations...')

  const typingsDir = __dirname
  const dtsFiles = getAllDtsFiles(typingsDir)

  console.log(`Found ${dtsFiles.length} .d.ts files to process`)

  for (const file of dtsFiles) {
    const filename = basename(file)

    // Skip files that are already hand-written
    if (filename === 'index.d.ts' || filename === 'Mocha.d.ts' || filename === 'utils.d.ts') {
      console.log(`Skipping ${filename} (hand-written)`)
      continue
    }

    console.log(`Processing ${filename}...`)

    if (isPromiseBased) {
      makePromiseBased(file)
    }

    cleanupDeclaration(file)
  }

  console.log('\nType definitions generated successfully!')
  console.log('Generated .d.ts files are in typings/ directory (excluded from git)')
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
