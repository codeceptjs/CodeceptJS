Feature('grab')

Scenario('grab', async ({ I }) => {
  const title = I.grabTitle()
  const text = await I.grabTextFrom('h1')
  I.grabCurrentUrl()
  I.say(I.grabValueFrom('#name'))
  const [a, b] = await Promise.all([I.grabTitle(), I.grabCurrentUrl()])
  I.grabTitle().then(t => I.say(t))
})

export default {
  getTitle() {
    return I.grabTitle()
  },
}
