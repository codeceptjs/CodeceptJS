const { I } = inject();

Feature('Plugins');

Scenario('retryTo works with await steps @plugin', async () => {
  await retryTo(async (tryNum) => {
    const foo = await I.grabCurrentUrl();
    if (tryNum < 3) I.waitForVisible('.nothing', 1);
  }, 4);
});

Scenario('retryTo works with non await steps @plugin', async () => {
  await retryTo(async (tryNum) => {
    if (tryNum < 3) I.waitForVisible('.nothing', 1);
  }, 4);
});



Scenario('Should be succeed @plugin', async ({ I }) => {
  I.amOnPage('http://example.org')
  I.waitForVisible('.nothing', 1); // should fail here but it won't terminate
  await retryTo( (tryNum) => {
      I.see(".doesNotMatter");
  }, 10);
})