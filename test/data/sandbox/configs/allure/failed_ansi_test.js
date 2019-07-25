const colors = require('chalk');

Feature('Filesystem').tag('main');

Scenario('check error with ansi symbols', (I) => {
  I.amInPath('.');
  I.say('hello world');
  throw new Error(colors.yellow('red message with ANSI symbols'));
}).tag('slow').tag('@important');
