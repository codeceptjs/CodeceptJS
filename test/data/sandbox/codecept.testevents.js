import eventHandlers from './eventHandlers';
import '../fake_driver';

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
