// refactored step class, moved to helper
/**
 * Step is wrapper around a helper method.
 * It is used to create a new step that is a combination of other steps.
 */
import BaseStep from './step/base.js'
import StepConfig from './step/config.js'
import Step from './step/helper.js'

/**
 * MetaStep is a step that is used to wrap other steps.
 * It is used to create a new step that is a combination of other steps.
 * It is used to create a new step that is a combination of other steps.
 */
import MetaStep from './step/meta.js'

/**
 * Step used to execute a single function
 */
import FuncStep from './step/func.js'

export default Step
export { MetaStep, BaseStep, StepConfig, FuncStep }
