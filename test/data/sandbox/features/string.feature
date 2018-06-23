Feature: Checkout string
  In order to buy products
  As a customer
  I want to be able to buy several products

  Scenario: describe product
    Given I have product described as
"""
A product description is the copy that describes the features and benefits of a product to a customer.
The goal of the product description is to provide the customer with enough information to compel them to want to buy the product immediately. To write a product description that converts, you need to write copy that persuades customers to buy. What problem does your product solve? What does your customer gain from using your product? What separates your products from others on the market? Your product description needs to answer these questions in a way that is easy to read.
"""
    When I go to checkout
    Then my order amount is $582
