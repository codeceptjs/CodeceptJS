const event = require('../event');
const container = require('../container');
const recorder = require('../recorder');
const { deepMerge } = require('../utils');
const { debug } = require('../output');
/**
 * Enable Helpers to listen to test events
 */
module.exports = function () {
  const helpers = container.helpers();

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
      const eventId = Math.random().toString(36).substr(2, 9);
      suite.eventId = eventId; // additional check we work for the same suite
      event.dispatcher.once(event.suite.after, (t) => {
        if (t.eventId && t.eventId === eventId) {
          helper._setConfig(oldConfig);
          debug(`[Suite Config] Reverted for ${helper.constructor.name}`);
        }
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
      const eventId = Math.random().toString(36).substr(2, 9);
      test.eventId = eventId; // additional check we work for the same test
      event.dispatcher.once(event.test.finished, (t) => {
        if (t.eventId && t.eventId === eventId) {
          helper._setConfig(oldConfig);
          debug(`[Test Config] Reverted for ${helper.constructor.name}`);
        }
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

