Feature('Filesystem').tag('main');

Scenario('check current dir', (I) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('fs_test.js');
}).tag('slow').tag('@important');
