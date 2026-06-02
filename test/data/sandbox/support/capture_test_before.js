import fs from 'fs'
import event from '../../../../lib/event.js'

export default function (config) {
  const captured = []

  event.dispatcher.on(event.test.before, test => {
    captured.push({
      phase: 'test.before',
      title: test?.title ?? null,
      tags: Array.isArray(test?.tags) ? [...test.tags] : null,
    })
  })

  event.dispatcher.on(event.test.after, test => {
    captured.push({
      phase: 'test.after',
      title: test?.title ?? null,
      tags: Array.isArray(test?.tags) ? [...test.tags] : null,
    })
  })

  const flush = () => {
    const outPath = config.outputFile || process.env.CAPTURE_OUTPUT
    if (!outPath) return
    fs.writeFileSync(outPath, JSON.stringify(captured, null, 2))
  }

  event.dispatcher.on(event.all.result, flush)
  event.dispatcher.on(event.all.after, flush)
}
