Feature('Retry #BeforeSuite helper hooks', { retryBeforeSuite: 3 }).retry(3);

BeforeSuite(async ({ I }) => {
  I.failIfNotWorks();
});

Scenario('helper hook works', () => {
  console.log('works');
});
