import event from '../event.js'

export default function () {
  event.dispatcher.on(event.hook.failed, err => {
    global.container.result().addStats({ failedHooks: 1 })
  })

  event.dispatcher.on(event.test.before, test => {
    global.container.result().addTest(test)
  })
}
