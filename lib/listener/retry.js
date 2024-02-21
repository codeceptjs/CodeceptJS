import * as event from '../event.js';
import * as output from '../output.js';
import Config from '../config.js';
import { isNotSet } from '../utils.js';

const hooks = ['Before', 'After', 'BeforeSuite', 'AfterSuite'];

export default function () {
  event.dispatcher.on(event.suite.before, (suite) => {
    let retryConfig = Config.get('retry');
    if (!retryConfig) return;

    if (Number.isInteger(+retryConfig)) {
      // is number
      const retryNum = +retryConfig;
      output.log(`Retries: ${retryNum}`);
      suite.retries(retryNum);
      return;
    }

    if (!Array.isArray(retryConfig)) {
      retryConfig = [retryConfig];
    }

    for (const config of retryConfig) {
      if (config.grep) {
        if (!suite.title.includes(config.grep)) continue;
      }

      hooks.filter(hook => !!config[hook]).forEach((hook) => {
        if (isNotSet(suite.opts[`retry${hook}`])) suite.opts[`retry${hook}`] = config[hook];
      });

      if (config.Feature) {
        if (isNotSet(suite.retries())) suite.retries(config.Feature);
      }

      output.log(`Retries: ${JSON.stringify(config)}`);
    }
  });

  event.dispatcher.on(event.test.before, (test) => {
    let retryConfig = Config.get('retry');
    if (!retryConfig) return;

    if (Number.isInteger(+retryConfig)) {
      if (test.retries() === -1) test.retries(retryConfig);
      return;
    }

    if (!Array.isArray(retryConfig)) {
      retryConfig = [retryConfig];
    }

    retryConfig = retryConfig.filter(config => !!config.Scenario);

    for (const config of retryConfig) {
      if (config.grep) {
        if (!test.fullTitle().includes(config.grep)) continue;
      }

      if (config.Scenario) {
        if (test.retries() === -1) test.retries(config.Scenario);
        output.log(`Retries: ${config.Scenario}`);
      }
    }
  });
}
