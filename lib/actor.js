const Step = require('./step')
const MetaStep = require('./step/meta')
const recordStep = require('./step/record')
const container = require('./container')
const { methodsOfObject } = require('./utils')
const { TIMEOUT_ORDER } = require('./timeout')
const event = require('./event')
const store = require('./store')
const output = require('./output')

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

  /**
   * set the maximum execution time for the next step
   * @function
   * @param {number} timeout - step timeout in seconds
   * @return {this}
   * @inner
   */
  limitTime(timeout) {
    if (!store.timeouts) return this

    console.log('I.limitTime() is deprecated, use step.timeout() instead')

    event.dispatcher.prependOnceListener(event.step.before, step => {
      output.log(`Timeout to ${step}: ${timeout}s`)
      step.setTimeout(timeout * 1000, TIMEOUT_ORDER.codeLimitTime)
    })

    return this
  }

  /**
   * @function
   * @param {*} [opts]
   * @return {this}
   * @inner
   */
  retry(opts) {
    console.log('I.retry() is deprecated, use step.retry() instead')
    const retryStep = require('./step/retry')
    retryStep(opts)
    return this
  }
}

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 * @ignore
 */
module.exports = function (obj = {}) {
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
                step.name = actionAlias
                step.actor = translation.I
              }
              // add methods to promise chain
              return recordStep(step, Array.from(arguments))
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

    container.append({
      support: {
        I: actor,
      },
    })
  })
  // store.actor = actor;
  // add custom steps from actor
  Object.keys(obj).forEach(key => {
    const ms = new MetaStep('I', key)
    ms.setContext(actor)
    actor[key] = ms.run.bind(ms, obj[key])
  })

  return actor
}
