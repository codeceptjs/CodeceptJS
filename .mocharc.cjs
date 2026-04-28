const path = require('path')

module.exports = {
  require: [path.join(__dirname, 'test', 'support', 'setup.mjs')],
  extension: ['js', 'mjs'],
}
