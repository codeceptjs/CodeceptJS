// helper class was moved out from this repository to allow extending from base class
// without loading full CodeceptJS package
if (!global.hermiona) global.hermiona = require('./index');
module.exports = require('hermiona-helper');
