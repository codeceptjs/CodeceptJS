import eventHandlers from './eventHandlers.js';
import '../fake_driver.js';

eventHandlers.setConsoleLogging(true);

export const config = {
  tests: './*_test.testevents.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../helper',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
