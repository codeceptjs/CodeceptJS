import gherkinLanguages from '@cucumber/gherkin/src/gherkin-languages.json' with { type: 'json' }

export function gherkinTranslations(langCode) {
  const { feature, scenario, scenarioOutline } = gherkinLanguages[langCode]
  return {
    Feature: feature[0],
    Scenario: scenario[0],
    ScenarioOutline: scenarioOutline[0],
  }
}
