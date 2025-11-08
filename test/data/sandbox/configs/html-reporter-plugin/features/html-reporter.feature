@html-reporter @smoke
Feature: HTML Reporter BDD Test
  In order to verify BDD support in HTML reporter  
  As a developer
  I want to see properly formatted Gherkin scenarios

  Background:
    Given I setup the test environment

  @important
  Scenario: Basic BDD test scenario
    Given I have a basic setup
    When I perform an action
    Then I should see the expected result
    And everything should work correctly
    But I should see the expected result

  @regression @critical
  Scenario: Test with data table
    Given I have the following items:
      | name     | price |
      | Item 1   | 10    |
      | Item 2   | 20    |
    When I process the items
    Then the total should be 30

  Scenario: Test that will fail
    Given I have a setup that will fail
    When I perform a failing action
    Then this step will not be reached