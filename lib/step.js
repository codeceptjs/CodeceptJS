// refactored step class, moved to helper
/**
 * Step is wrapper around a helper method.
 * It is used to create a new step that is a combination of other steps.
 */
const BaseStep = require('./step/base')
const StepConfig = require('./step/config')
const Step = require('./step/helper')

/**
 * MetaStep is a step that is used to wrap other steps.
 * It is used to create a new step that is a combination of other steps.
 * It is used to create a new step that is a combination of other steps.
 */
const MetaStep = require('./step/meta')

/**
 * Step used to execute a single function
 */
const FuncStep = require('./step/func')

module.exports = Step
module.exports.MetaStep = MetaStep
module.exports.BaseStep = BaseStep
module.exports.StepConfig = StepConfig
module.exports.FuncStep = FuncStep
