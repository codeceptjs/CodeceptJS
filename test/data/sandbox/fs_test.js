Feature('Filesystem').tag('main');

Scenario('check current dir', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('codecept.js');
}).tag('slow').tag('@important');
