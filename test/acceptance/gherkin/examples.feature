@Puppeteer @WebDriverIO @bdd
Feature: Business examples
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Scenario Outline: different pages
    Given I opened website
    When go to "<url>" page
    Then I should see "<text>"

    Examples:
      | url       | text          |
      | /         | Welcome       |
      | /info     | Information   |
      | /login    | Remember Me   |
