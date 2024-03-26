const { heal } = require('../lib/index');

heal.addRecipe('clickAndType', {
  priority: 1,
  steps: [
    'fillField',
    'appendField',
  ],
  fn: async ({ step }) => {
    const locator = step.args[0];
    const text = step.args[1];

    return ({ I }) => {
      I.click(locator);
      I.wait(1); // to open modal or something
      I.type(text);
    };
  },
});

// if error X -> send request to service
// if cached -> send request to invalidate cache
// if server is down - restart the server
