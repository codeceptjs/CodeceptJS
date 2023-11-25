Feature: Checkout examples process
  In order to buy products
  As a customer
  I want to be able to buy several products

  @user
  Scenario Outline: order discount
    Given I have product with price <price>$ in my cart
    And discount for orders greater than $20 is 10 %
    When I go to checkout
    Then I should see overall price is "<total>" $

    Examples:
      | price | total |
      | 10    | 10.0    |
      | 20    | 20.0    |
      | 21    | 18.9  |
      | 30    | 27.0    |
      | 50    | 45.0    |
