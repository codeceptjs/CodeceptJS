Feature('Filesystem').tag('main');

Scenario('check error with ansi symbols', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
  throw new Error('message with ANSI symbols \n \u001b[32mgreen\u001b[39m');
}).tag('slow').tag('@important');
