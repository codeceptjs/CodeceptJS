@fail
Feature: Failing

  Scenario: failed bdd test
    Given I make a request (and it fails)
    Then my test execution gets stuck