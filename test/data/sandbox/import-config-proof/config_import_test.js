import { config } from 'codeceptjs'
import assert from 'assert'

Feature('import config')

Scenario('config imported from codeceptjs is the live running instance', () => {
  const name = config.get('name')
  assert.strictEqual(name, 'import-config-proof', `expected live config.name "import-config-proof" but got "${name}" (second module copy?)`)
})
