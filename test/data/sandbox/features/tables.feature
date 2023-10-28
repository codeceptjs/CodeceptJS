Feature: Checkout products
  In order to buy products
  As a customer
  I want to be able to buy several products

  Scenario: checkout 3 products
    Given I have products in my cart
      | name         | category    | price  |
      | Harry Potter | Books       | 5      |
      | iPhone 5     | Smartphones | 1200   |
      | Nuclear Bomb | Weapons     | 100000 |
    When I go to checkout
    Then my order amount is $101205

  Scenario: checkout 3 products with long name
    Given I have products in my cart
      | name                                 | category    | price  |
      | Harry Potter and the deathly hallows | Books       | 5      |
      | iPhone 5                             | Smartphones | 1200   |
      | Nuclear Bomb                         | Weapons     | 100000 |
    When I go to checkout
    Then my order amount is $101205
