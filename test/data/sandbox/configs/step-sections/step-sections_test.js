const { Section, EndSection } = require('codeceptjs/steps')

Feature('step-sections')

Scenario('test using of basic step-sections', ({ I }) => {
  I.amInPath('.')

  Section('User Journey')
  I.act('Hello, World!')

  Section()
  I.act('Nothing to say')
})

Scenario('test using of step-sections and page objects', ({ I, userPage }) => {
  Section('User Journey')
  userPage.actOnPage()

  I.act('One more step')

  Section()

  I.act('Nothing to say')
})

Scenario('test using of hidden step-sections', ({ I, userPage }) => {
  Section('User Journey').hidden()
  userPage.actOnPage()
  I.act('One more step')

  EndSection()

  I.act('Nothing to say')
})
