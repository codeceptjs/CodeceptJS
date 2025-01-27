const { retryTo } = require('../effects')

module.exports = function (config) {
  console.log(`
Deprecation Warning: 'retryTo' has been moved to the effects module.
You should update your tests to use it as follows:

\`\`\`javascript
const { retryTo } = require('codeceptjs/effects');

// Example: Retry these steps 5 times before failing
await retryTo((tryNum) => {
  I.switchTo('#editor frame');
  I.click('Open');
  I.see('Opened');
}, 5);
\`\`\`

For more details, refer to the documentation.
  `)

  if (config.registerGlobal) {
    global.retryTo = retryTo
  }

  return retryTo
}
