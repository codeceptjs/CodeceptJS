Feature: Auth

  Scenario: Login to website
    Given I open a browser on a site
    When I click login button at 1.2
    Then I see welcome message

  Scenario: Logout from website
    Given I open a browser on a site
    And I click login button at 1.2
    And I see welcome message
    When I click logout
    Then I see goodbye message
