module.exports.gherkinTranslations = function (langCode) {
  const gherkinLanguages = require('@cucumber/gherkin/src/gherkin-languages.json')
  const { feature, scenario, scenarioOutline } = gherkinLanguages[langCode]
  return {
    Feature: feature[0],
    Scenario: scenario[0],
    ScenarioOutline: scenarioOutline[0],
  }
}
