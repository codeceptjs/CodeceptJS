import { track } from './timeline.js'

Feature('Serial lane @serial')

Scenario('serial one', async () => {
  await track('serial one')
})

Scenario('serial two', async () => {
  await track('serial two')
})
