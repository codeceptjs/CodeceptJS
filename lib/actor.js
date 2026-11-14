import Step, { MetaStep } from './step.js'
import recordStep, { applyStepConfig } from './step/record.js'
import StepConfig from './step/config.js'
import { methodsOfObject } from './utils.js'
import event from './event.js'
import output from './output.js'
import Container from './container.js'

/**
 * @interface
 * @alias ActorStatic
 */
class Actor {
  /**
   * Print the comment on log. Also, adding a step in the `Test.steps` object
   * @param {string} msg
   * @param {string} color
   * @inner
   *
   * ⚠️ returns a promise which is synchronized internally by recorder
   */
  async say(msg, color = 'cyan') {
    const step = new Step('say', 'say')
    step.status = 'passed'
    return recordStep(step, [msg]).then(() => {
      // this is backward compatibility as this event may be used somewhere
      event.emit(event.step.comment, msg)
      output.say(msg, `${color}`)
    })
  }
}

function addStepConfigChain(promise, step) {
  promise.stepConfig = config => {
    if (step.status !== 'queued') {
      throw new Error(`Can't configure "${step.title}": the step was already executed. Chain it to the step call: I.${step.title}(...).first()`)
    }
    applyStepConfig(step, config)
    return promise
  }

  promise.first = () => promise.stepConfig(new StepConfig({ elementIndex: 'first' }))
  promise.last = () => promise.stepConfig(new StepConfig({ elementIndex: 'last' }))
  promise.at = position => promise.stepConfig(new StepConfig({ elementIndex: position }))
  promise.timeout = seconds => promise.stepConfig(new StepConfig().timeout(seconds))
  promise.retry = retry => promise.stepConfig(new StepConfig().retry(retry))
  return promise
}

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 * @ignore
 */
export default function (obj = {}, container) {
  // Use global container if none provided
  if (!container) {
    container = Container
  }

  // Get existing actor or create a new one
  const actor = container.actor() || new Actor()

  // load all helpers once container initialized
  container.started(() => {
    const translation = container.translation()
    const helpers = container.helpers()

    // add methods from enabled helpers
    Object.values(helpers).forEach(helper => {
      methodsOfObject(helper, 'Helper')
        .filter(method => method !== 'constructor' && method[0] !== '_')
        .forEach(action => {
          const actionAlias = translation.actionAliasFor(action)
          if (!actor[action]) {
            actor[action] = actor[actionAlias] = function () {
              const step = new Step(helper, action)
              if (translation.loaded) {
                step.title = actionAlias
                step.actor = translation.I
              }
              // add methods to promise chain
              return addStepConfigChain(recordStep(step, Array.from(arguments)), step)
            }
          }
        })
    })

    // add translated custom steps from actor
    Object.keys(obj).forEach(key => {
      const actionAlias = translation.actionAliasFor(key)
      if (!actor[actionAlias]) {
        actor[actionAlias] = actor[key]
      }
    })

    // Update container.support.I to ensure it has the latest actor reference
    if (!container.actor() || container.actor() !== actor) {
      container.append({
        support: {
          I: actor,
        },
      })
    }
  })

  // add custom steps from actor immediately
  Object.keys(obj).forEach(key => {
    const ms = new MetaStep('I', key)
    ms.setContext(actor)
    actor[key] = ms.run.bind(ms, obj[key])
  })

  return actor
}
