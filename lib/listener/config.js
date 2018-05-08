const event = require('../event');
const container = require('../container');
const recorder = require('../recorder');
<<<<<<< HEAD
const { deepMerge } = require('../utils');
=======
const { deepMerge, ucfirst } = require('../utils');
>>>>>>> dynamic-config
const { debug } = require('../output');
/**
 * Enable Helpers to listen to test events
 */
module.exports = function () {
  const helpers = container.helpers();

<<<<<<< HEAD
  event.dispatcher.on(event.suite.before, (suite) => {
    function updateHelperConfig(helper, config) {
      const oldConfig = Object.assign({}, helper.options);
      try {
        helper._setConfig(deepMerge(Object.assign({}, oldConfig), config));
        debug(`[Suite Config] ${helper.constructor.name} ${JSON.stringify(config)}`);
      } catch (err) {
        recorder.throw(err);
        return;
      }
      event.dispatcher.once(event.suite.after, (t) => {
        helper._setConfig(oldConfig);
        debug(`[Suite Config] Reverted for ${helper.constructor.name}`);
      });
    }

    // change config
    if (suite.config) {
      for (let name in suite.config) {
        const config = suite.config[name];
        if (name === '0') { // first helper
          name = Object.keys(helpers);
        }
        const helper = helpers[name];
        updateHelperConfig(helper, config);
      }
    }
  });

  event.dispatcher.on(event.test.before, (test) => {
    if (!test) return;
    function updateHelperConfig(helper, config) {
      const oldConfig = Object.assign({}, helper.options);
      try {
        helper._setConfig(deepMerge(Object.assign({}, oldConfig), config));
        debug(`[Test Config] ${helper.constructor.name} ${JSON.stringify(config)}`);
      } catch (err) {
        recorder.throw(err);
        return;
      }
      event.dispatcher.once(event.test.finished, (t) => {
        helper._setConfig(oldConfig);
        debug(`[Test Config] Reverted for ${helper.constructor.name}`);
      });
    }

    // change config
    if (test.config) {
      for (let name in test.config) {
        const config = test.config[name];
        if (name === '0') { // first helper
          name = Object.keys(helpers);
        }
        const helper = helpers[name];
        updateHelperConfig(helper, config);
      }
    }
  });
};

=======
  enableDynamicConfigFor('suite');
  enableDynamicConfigFor('test');

  function enableDynamicConfigFor(type) {
    event.dispatcher.on(event[type].before, (context) => {
      function updateHelperConfig(helper, config) {
        const oldConfig = Object.assign({}, helper.options);
        try {
          helper._setConfig(deepMerge(Object.assign({}, oldConfig), config));
          debug(`[${ucfirst(type)} Config] ${helper.constructor.name} ${JSON.stringify(config)}`);
        } catch (err) {
          recorder.throw(err);
          return;
        }
        event.dispatcher.once(event[type].after, (t) => {
          helper._setConfig(oldConfig);
          debug(`[${ucfirst(type)} Config] Reverted for ${helper.constructor.name}`);
        });
      }

      // change config
      if (context.config) {
        for (let name in context.config) {
          const config = context.config[name];
          if (name === '0') { // first helper
            name = Object.keys(helpers);
          }
          const helper = helpers[name];
          updateHelperConfig(helper, config);
        }
      }
    });
  }
};
>>>>>>> dynamic-config
