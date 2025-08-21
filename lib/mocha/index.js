import Suite from 'mocha/lib/suite.js'
import Test from 'mocha/lib/test.js'
import { BeforeHook, AfterHook, BeforeSuiteHook, AfterSuiteHook } from './hooks.js'

const indexModule = {
  Suite,
  Test,
  BeforeHook,
  AfterHook,
  BeforeSuiteHook,
  AfterSuiteHook,
}


// Export named functions
export { Suite, Test, BeforeHook, AfterHook, BeforeSuiteHook, AfterSuiteHook }

export default indexModule
