import event from '../event.js'
import container from '../container.js'

export default function () {
  event.dispatcher.on(event.hook.failed, err => {
    container.result().addStats({ failedHooks: 1 })
  })

  event.dispatcher.on(event.test.before, test => {
    container.result().addTest(test)
  })
}
