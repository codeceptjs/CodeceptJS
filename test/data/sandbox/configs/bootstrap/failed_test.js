Feature('Filesystem').tag('main');

Scenario('check current dir', (I) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('unknown.js');
}).tag('slow').tag('@important');

Scenario('check current dir with wait', (I) => {
  I.amInPath('.');
  I.say('hello world');
  I.waitForFile('unknown.js', 1);
}).tag('slow').tag('@important');
