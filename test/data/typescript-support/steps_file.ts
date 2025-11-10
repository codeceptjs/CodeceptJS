// Test steps file that imports another TypeScript file
import { helperFunction, helperConstant } from './helper.js'

export default function() {
  return {
    testMethod() {
      return 'test from steps_file'
    },
    
    useHelper() {
      return helperFunction()
    },
    
    getConstant() {
      return helperConstant
    }
  }
}
