const { I } = inject()

Feature('Plugins')

Scenario('retryTo works with await steps @plugin', async () => {
  await retryTo(async tryNum => {
    const foo = await I.grabCurrentUrl()
    if (tryNum < 3) I.waitForVisible('.nothing', 1)
  }, 4)
})

Scenario('retryTo works with non await steps @plugin', async () => {
  await retryTo(async tryNum => {
    if (tryNum < 3) I.waitForVisible('.nothing', 1)
  }, 4)
})

Scenario('Should be succeed', async ({ I }) => {
  I.amOnPage('http://example.org')
  I.waitForVisible('.nothing', 1) // should fail here but it won't terminate
  await retryTo(tryNum => {
    I.see('.doesNotMatter')
  }, 10)
})

Scenario('Should fail after reached max retries', async () => {
  await retryTo(() => {
    throw new Error('Custom pluginRetryTo Error')
  }, 3)
})

Scenario('Should succeed at the third attempt @plugin', async () => {
  await retryTo(async tryNum => {
    if (tryNum < 2) throw new Error('Custom pluginRetryTo Error')
  }, 3)
})
