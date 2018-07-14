Feature: Login

  Scenario: Login to website
    Given I open a browser on a site
    When I click login button at 1.2
    And I enter username "davert" and password "wow"
    And I submit 1 form
    Then I should log in