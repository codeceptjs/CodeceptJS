Feature('Filesystem').tag('main');

Scenario('see file in current dir and assert content', (I) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('fs_test.js');
  I.seeFileContentsEqualReferenceFile(__filename);
}).tag('slow').tag('@important');

Scenario('wait for file in current dir', (I) => {
  I.amInPath('.');
  I.say('hello world');
  I.waitForFile('fs_test.js');
}).tag('slow').tag('@important');
