const event = require('../event')
const container = require('../container')
const recorder = require('../recorder')
const { deepMerge, deepClone, ucfirst } = require('../utils')
const { debug } = require('../output')
/**
 * Enable Helpers to listen to test events
 */
module.exports = function () {
  const helpers = container.helpers()

  enableDynamicConfigFor('suite')
  enableDynamicConfigFor('test')

  function enableDynamicConfigFor(type) {
    event.dispatcher.on(event[type].before, (context = {}) => {
      function updateHelperConfig(helper, config) {
        const oldConfig = { ...helper.options }
        try {
          helper._setConfig(deepMerge(deepClone(oldConfig), config))
          debug(`[${ucfirst(type)} Config] ${helper.constructor.name} ${JSON.stringify(config)}`)
        } catch (err) {
          recorder.throw(err)
          return
        }
        event.dispatcher.once(event[type].after, () => {
          helper._setConfig(oldConfig)
          debug(`[${ucfirst(type)} Config] Reverted for ${helper.constructor.name}`)
        })
      }

      // change config
      if (context.config) {
        for (let name in context.config) {
          const config = context.config[name]
          if (name === '0') {
            // first helper
            name = Object.keys(helpers)[0]
          }
          const helper = helpers[name]
          updateHelperConfig(helper, config)
        }
      }
    })
  }
}
