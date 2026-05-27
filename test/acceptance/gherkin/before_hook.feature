@Playwright @Puppeteer @WebDriverIO @bdd @hookCapture
Feature: Before hooks receive the real scenario

  Background:
    Given I opened website

  @scenarioHook
  Scenario: Before hook captures scenario metadata
    Then the Before hook should have captured this scenario
