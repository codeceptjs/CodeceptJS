@Protractor @Puppeteer @WebDriverIO @bdd
Feature: Site test
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Background:
    Given I opened website

  Scenario: check text
    Then I should see "Welcome to test app"
