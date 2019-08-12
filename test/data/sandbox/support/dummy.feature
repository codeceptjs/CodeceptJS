Feature: Login

  Scenario: Login to website
    Given I open a browser on a site
    When I click login button at 1.2
    And I enter username "davert" and password "wow"
    And I submit 1 form
    Then I should log in
    When I define a step with an opening paren ( only
    And I define a step with a closing paren ) only
    And I define a step with a opening brace { only
    And I define a step with a closing brace } only
    And I define a step with a slash http://example.com/foo
    And I define a step with a ( paren and an 32 int
    And I define a step with a ( paren and a 32.2 float
    And I define a step with a ( paren and a "foo" string
