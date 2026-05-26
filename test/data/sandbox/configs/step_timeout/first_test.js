import step from 'codeceptjs/steps'

const { I } = inject()

Feature('Steps')

Scenario('Default command timeout', ({ I }) => {
  I.exceededByTimeout(1500)
})

Scenario('Wait command timeout', ({ I }) => {
  I.waitForSleep(1500)
})

Scenario('Rerun sleep', ({ I }) => {
  I.statefulSleep(2250, step.retry(2))
})

Scenario('Wait with longer timeout', ({ I }) => {
  I.waitTadLonger(750)
})

Scenario('Wait with shorter timeout', ({ I }) => {
  I.waitTadShorter(750)
})
