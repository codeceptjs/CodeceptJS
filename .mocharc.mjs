import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  require: [path.join(__dirname, 'test', 'support', 'setup.mjs')],
  extension: ['js', 'mjs'],
}