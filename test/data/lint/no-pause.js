Feature('pause')

Scenario('debug', ({ I }) => {
  I.amOnPage('/')
  pause()
  I.see('Welcome')
})
