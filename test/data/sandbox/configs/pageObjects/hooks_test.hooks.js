Feature('PageObject Hooks')

Scenario('@PageObjectHooks', ({ hookpage }) => {
  hookpage.doSomething()
})

Scenario('@PageObjectHooksMultipleCalls', ({ hookpage }) => {
  hookpage.doSomething()
  hookpage.doSomething()
})

Scenario('@PageObjectNoHooksUsed', ({ nohookpage }) => {
  nohookpage.doAction()
})

Scenario('@PageObjectNotUsed', ({ I }) => {
  I.printMessage('only I used')
})
