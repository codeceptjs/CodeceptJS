Feature('Retry #Helper hooks', { retryBefore: 2 });

Before(async ({ I }) => {
  I.failIfNotWorks();
});

Scenario('helper hook works', () => {
  console.log('works');
});
