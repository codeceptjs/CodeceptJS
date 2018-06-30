@async
Feature: Checkout process
  In order to buy products
  As a customer
  I want to be able to buy several products

  Scenario: checkout
    Given I have simple product
    When I go to checkout process
    Then I should see that total number of products is 1
    And my order amount is $10