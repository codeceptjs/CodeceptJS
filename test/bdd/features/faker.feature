@bdd
Feature: Faker examples

  Scenario Outline: faker data genetation
              Given I sold the "<product>" car to "<customer>" for "<price>"
               When customer "<customer>" paid "<price>" for car "<product>" in "<cashier>"
               Then "<cashier>" returned "<change>" in change to "<customer>"
          Examples:
  | product             | customer              | price              | cashier   |
  | {{vehicle.vehicle}} | Dr. {{name.findName}} | {{commerce.price}} | cashier 2 |
