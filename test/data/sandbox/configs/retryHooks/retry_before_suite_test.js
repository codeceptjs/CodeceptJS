Feature('Retry before suite helper hooks').retry(3);

BeforeSuite(async ({ I }) => {
  I.failIfNotWorks();
});

Scenario('helper hook works', () => {
  console.log('works');
});
