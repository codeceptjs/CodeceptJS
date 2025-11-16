import event from '../event.js'
import recorder from '../recorder.js'
import { deepMerge, deepClone, ucfirst } from '../utils.js'
import output from '../output.js'

/**
 * Enable Helpers to listen to test events
 */
export default function () {
  // Use global flag to prevent duplicate initialization across module re-imports
  if (global.__codeceptConfigListenerInitialized) {
    return
  }
  global.__codeceptConfigListenerInitialized = true

  enableDynamicConfigFor('suite')
  enableDynamicConfigFor('test')

  function enableDynamicConfigFor(type) {
    event.dispatcher.on(event[type].before, (context = {}) => {
      // Get helpers dynamically at runtime, not at initialization time
      // This ensures we get the actual helper instances, not placeholders
      const helpers = global.container.helpers()

      function updateHelperConfig(helper, config) {
        // Guard against undefined or invalid helpers
        if (!helper || !helper.constructor) {
          output.debug(`[${ucfirst(type)} Config] Helper not found or not properly initialized`)
          return
        }

        const oldConfig = deepClone(helper.options)
        try {
          helper._setConfig(deepMerge(deepClone(oldConfig), config))
          output.debug(`[${ucfirst(type)} Config] ${helper.constructor.name} ${JSON.stringify(config)}`)
        } catch (err) {
          recorder.throw(err)
          return
        }
        const restoreCallback = () => {
          helper._setConfig(oldConfig)
          output.debug(`[${ucfirst(type)} Config] Reverted for ${helper.constructor.name}`)
        }
        event.dispatcher.once(event[type].after, restoreCallback)
      }

      // change config
      if (context.config) {
        for (let name in context.config) {
          const config = context.config[name]
          if (name === '0') {
            // first helper - get dynamically
            name = Object.keys(helpers)[0]
          }
          const helper = helpers[name]
          updateHelperConfig(helper, config)
        }
      }
    })
  }
}
