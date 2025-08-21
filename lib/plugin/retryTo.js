import { retryTo } from '../effects.js'

const defaultConfig = {
  registerGlobal: true,
}

export default function (config) {
  config = Object.assign(defaultConfig, config)
  console.log(`Deprecation Warning: 'retryTo' has been moved to the 'codeceptjs/effects' module. Disable retryTo plugin to remove this warning.`)

  if (config.registerGlobal) {
    global.retryTo = retryTo
  }

  return retryTo
}
;