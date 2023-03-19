Feature('Fail #FailBefore hook', { timeout: 10000 });

Before(async ({ I }) => {
  I.failIfNotWorks();
});

Scenario('helper hook works', () => {
  console.log('not works');
});
