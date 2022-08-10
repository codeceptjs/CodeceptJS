Feature: Business rules
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Scenario: do something
    Given I have a defined step
    When I open GitHub

  Scenario Outline: check parameter substitution
    Given I have a defined step
    When I see "<text>" text and "<text>" is not "xyz"
    Examples:
      | text   |
      | Google |
