Feature('StepByStep Test')

Scenario('Test with steps that should create screenshots @stepbystep', ({ I }) => {
  I.printBrowser()
  I.wait(0.1) // Small wait to create different steps
  I.printWindowSize()
  I.wait(0.1)
  I.printBrowser()
})

Scenario('Another test for multiple reports @stepbystep', ({ I }) => {
  I.printWindowSize()
  I.wait(0.1)
  I.printBrowser()
  I.wait(0.1)
  I.printWindowSize()
})
