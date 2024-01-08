const { I } = inject();

Feature('Plugins');

Scenario('retryTo works with await steps @plugin', async ({ I }) => {
  await retryTo(async (tryNum) => {
    const foo = await I.grabCurrentUrl();
    if (tryNum < 3) I.waitForVisible('.nothing', 1);
  }, 4);
});
