@important
Feature: Checkout process
  In order to buy products
  As a customer
  I want to be able to buy several products

  @very
  Scenario: checkout
    Given I have product with $600 price in my cart
    And I have product with $1000 price
    When I go to checkout process
    Then I should see that total number of products is 2
    And my order amount is $1600