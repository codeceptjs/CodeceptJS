Feature('@CustomStepsBuiltIn');

Scenario('Does not override', ({ I }) => {
  I.say('Built in say');
  I.saySomethingElse();
});
