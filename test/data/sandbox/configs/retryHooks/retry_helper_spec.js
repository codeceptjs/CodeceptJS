Feature('Retry #Helper hooks');

Before(async ({ I }) => {
  I.failIfNotWorks();
});

Scenario('helper hook works', () => {
  console.log('works');
});
