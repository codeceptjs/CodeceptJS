import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function gherkinTranslations(langCode) {
  // Load gherkin languages JSON file
  const gherkinLanguagesPath = join(__dirname, '../node_modules/@cucumber/gherkin/src/gherkin-languages.json')
  const gherkinLanguages = JSON.parse(readFileSync(gherkinLanguagesPath, 'utf8'))
  const { feature, scenario, scenarioOutline } = gherkinLanguages[langCode]
  return {
    Feature: feature[0],
    Scenario: scenario[0],
    ScenarioOutline: scenarioOutline[0],
  }
}
