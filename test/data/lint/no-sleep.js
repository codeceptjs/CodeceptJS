const { I } = inject()

Feature('sleep')

Scenario('sleeps', async ({ I }) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  I.waitForText('Done')
})

export default {
  async open() {
    I.amOnPage('/')
    setTimeout(() => {}, 500)
  },
}

function utility(fn) {
  setTimeout(fn, 10)
}
