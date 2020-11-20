// helper class was moved out from this repository to allow extending from base class
// without loading full CodeceptJS package
if (!global.codeceptjs) global.codeceptjs = require('./index');
module.exports = require('@codeceptjs/helper');
