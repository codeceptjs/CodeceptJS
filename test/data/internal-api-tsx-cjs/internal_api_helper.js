import HelperModule from '../../../lib/helper.js'
import ConfigModule from '../../../lib/config.js'

const Helper = HelperModule.default || HelperModule
const Config = ConfigModule.default || ConfigModule

class ConfigHelper extends Helper {
  reportConfig() {
    // Helper is loaded via import() (the ESM realm), so it has always shared the live config.
    console.log(`API_HELPER marker=${Config.get().helpers.ConfigHelper.marker}`)
  }
}

export default ConfigHelper
