Feature: Custom Data Masking

  Scenario: mask custom sensitive data in output
    Given I have user email "john.doe@example.com"
    And I have credit card "4111 1111 1111 1111"
    And I have phone number "+1-555-123-4567"
    When I process user data
    Then I should see masked output