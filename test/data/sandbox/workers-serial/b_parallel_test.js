import { track } from './timeline.js'

Feature('Parallel lane')

Scenario('parallel one', async () => {
  await track('parallel one')
})

Scenario('parallel two', async () => {
  await track('parallel two')
})

Scenario('serial three @serial', async () => {
  await track('serial three')
})

Scenario('parallel three', async () => {
  await track('parallel three')
})
