import fs from 'fs'
import { fileURLToPath } from 'url'

export const timelineFile = fileURLToPath(new URL('../output/serial_timeline.log', import.meta.url))

export async function track(name, duration = 300) {
  fs.appendFileSync(timelineFile, `start ${name}\n`)
  await new Promise(resolve => setTimeout(resolve, duration))
  fs.appendFileSync(timelineFile, `end ${name}\n`)
}
