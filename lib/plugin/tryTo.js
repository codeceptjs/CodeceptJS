import { tryTo } from '../effects.js'

const defaultConfig = {
  registerGlobal: true,
}

export default function (config) {
  config = Object.assign(defaultConfig, config)
  console.log(`Deprecation Warning: 'tryTo' has been moved to the 'codeceptjs/effects' module. Disable tryTo plugin to remove this warning.`)

  if (config.registerGlobal) {
    global.tryTo = tryTo
  }

  return tryTo
}
;