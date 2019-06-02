Feature: Include Examples in dataTtable placeholder

  @IncludeExamplesIndataTtable
  Scenario Outline: order a product with discount
    Given I have this product in my cart
      | data     | value      |
      | name     | <name>     |
      | price    | <price>    |
      | discount | <discount> |
      | quantity | <quantity> |

    Then I should see total price is "<total>" $

    Examples:
      | name         | price | discount | quantity | total |
      | iPhone 5     | 10    | 1        | 2        | 19.0  |
      | Nuclear Bomb | 20    | 2        | 1        | 18.0  |
