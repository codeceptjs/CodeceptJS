Feature('Custom Workers');

Scenario('say custom something', ({ I }) => {
  I.say('Hello Workers');
  I.sayCustomMessage();
});
