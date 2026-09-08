import { config as baseConfig } from './codecept.conf.js'

export const config = {
  ...baseConfig,
  require: ['tsx/esm'],
  name: 'typescript-step-paths-esm',
}
