Feature: Worker gherkin multi scenario

  Scenario Outline: runs once @worker_gherkin_multi
    Given I open a browser on a site

    Examples:
      | id |
      | 1  |
      | 2  |
