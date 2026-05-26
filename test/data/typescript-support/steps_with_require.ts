const path = require('path')

module.exports = function() {
  return {
    getPluginPath() {
      return path.join(__dirname, 'plugins', 'custom.js')
    },
    
    loadModule(name) {
      // This simulates loading a module using require
      return require(name)
    }
  }
}
