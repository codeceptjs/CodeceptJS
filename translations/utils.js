import { dialects } from '@cucumber/gherkin'

export function gherkinTranslations(langCode) {
  const { feature, scenario, scenarioOutline } = dialects[langCode]
  return {
    Feature: feature[0],
    Scenario: scenario[0],
    ScenarioOutline: scenarioOutline[0],
  }
}
