Feature('Retry #BeforeSuite helper hooks');

BeforeSuite(async ({ I }) => {
  I.failIfNotWorks();
});

Scenario('helper hook works', () => {
  console.log('works');
});
