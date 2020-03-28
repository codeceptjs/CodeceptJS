@WebDriverIO @bdd
Feature: Web Components Shadow Dom Elements

  In order to achieve my goals
  As a persona
  I want to be able to interact with a shadow dom

  Scenario: Interacts with Shadow DOM elements in Web Componenets
    Given I opened "https://recipes.lwc.dev" website
    Then I should be able to fill the value in Hello Binding Shadow Input Element
