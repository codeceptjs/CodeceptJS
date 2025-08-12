import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const require = createRequire(import.meta.url)
const { ClientFunction } = require('testcafe')
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { getParamNames } from '../../utils.js'

const createTestFile = () => {
  assert(global.output_dir, 'global.output_dir must be set')

  const testFile = path.join(global.output_dir, `${Date.now()}_test.js`)
  const testControllerHolderDir = __dirname.replace(/\\/g, '/')

  fs.writeFileSync(
    testFile,
    `const testControllerHolder = require("${testControllerHolderDir}/testControllerHolder.cjs");\n\n
    fixture("fixture")\n
    test\n
    ("test", testControllerHolder.capture)`,
  )

  return testFile
}

const mapError = testcafeErr => {
  if (!testcafeErr) return new Error('Unknown error')

  const code = testcafeErr.code
  if (code && testcafeErr.callsite) {
    return testcafeErr
  }

  const stack = testcafeErr.stack || testcafeErr.toString()
  const message = testcafeErr.message || testcafeErr.toString()
  const error = new Error(message)
  error.stack = stack
  return error
}

const createClientFunction = clientFn => {
  const fnString = clientFn.toString()
  const params = getParamNames(clientFn)

  return ClientFunction(fnString, { dependencies: {} })
}

export { createTestFile, mapError, createClientFunction }
