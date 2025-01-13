module.exports = function () {
  console.log(`
Deprecated Warning: 'tryTo' has been moved to the effects module.
You should update your tests to use it as follows:

\`\`\`javascript
const { tryTo } = require('codeceptjs/effects');

// Example: failed step won't fail a test but will return true/false
await tryTo(() => {
  I.switchTo('#editor frame');
});
\`\`\`

For more details, refer to the documentation.
  `)
}
