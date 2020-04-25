Feature('Filesystem').tag('main');

Scenario('check error with ansi symbols', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
}).tag('fast').tag('@important');
