---
permalink: /bdd
title: Behavior Driven Development
---

# Behavior Driven Development

Behavior Driven Development (BDD) is a popular software development methodology. BDD is considered an extension of TDD, and is greatly inspired by [Agile](http://agilemanifesto.org/) practices. The primary reason to choose BDD as your development process is to break down communication barriers between business and technical teams. BDD encourages the use of automated testing to verify all documented features of a project from the very beginning. This is why it is common to talk about BDD in the context of test frameworks (like CodeceptJS). The BDD approach, however, is about much more than testing - it is a common language for all team members to use during the development process.

## What is Behavior Driven Development

BDD was introduced by [Dan North](https://dannorth.net/introducing-bdd/). He described it as:

> outside-in, pull-based, multiple-stakeholder, multiple-scale, high-automation, agile methodology. It describes a cycle of interactions with well-defined outputs, resulting in the delivery of working, tested software that matters.

BDD has its own evolution from the days it was born, started by replacing "test" to "should" in unit tests, and moving towards powerful tools like Cucumber and Behat, which made user stories (human readable text) to be executed as an acceptance test.

The idea of story BDD can be narrowed to:

* describe features in a scenario with a formal text
* use examples to make abstract things concrete
* implement each step of a scenario for testing
* write actual code implementing the feature

By writing every feature in User Story format that is automatically executable as a test we ensure that: business, developers, QAs and managers are in the same boat.

BDD encourages exploration and debate in order to formalize the requirements and the features that needs to be implemented by requesting to write the User Stories in a way that everyone can understand.

By making tests to be a part of User Story, BDD allows non-technical personnel to write (or edit) Acceptance tests.

With this procedure we also ensure that everyone in a team knows what has been developed, what has not, what has been tested and what has not.

### Ubiquitous Language

The ubiquitous language is always referred as *common* language. That is it's main benefit. It is not a couple of our business specification's words, and not a couple of developer's technical terms. It is a common words and terms that can be understood by people for whom we are building the software and should be understood by developers. Establishing correct communication between this two groups people is vital for building successful project that will fit the domain and fulfill all business needs.

Each feature of a product should be born from a talk between

* business (analysts, product owner)
* developers
* QAs

which are known in BDD as "three amigos".

Such talks should produce written stories. There should be an actor that doing some things, the feature that should be fulfilled within the story and the result achieved.

We can try to write such simple story:

```
As a customer I want to buy several products
I put first product with $600 price to my cart
And then another one with $1000 price
When I go to checkout process
I should see that total number of products I want to buy is 2
And my order amount is $1600
```

As we can see this simple story highlights core concepts that are called *contracts*. We should fulfill those contracts to model software correctly. But how we can verify that those contracts are being satisfied? [Cucumber](http://cucumber.io) introduced a special language for such stories called **Gherkin**. Same story transformed to Gherkin will look like this:

```gherkin
Feature: checkout process
  In order to buy products
  As a customer
  I want to be able to buy several products

  Scenario:
    Given I have product with $600 price in my cart
    And I have product with $1000 price
    When I go to checkout process
    Then I should see that total number of products is 2
    And my order amount is $1600
```

**CodeceptJS can execute this scenario step by step as an automated test**.
Every step in this scenario requires a code which defines it.

## Gherkin

Let's learn some more about Gherkin format and then we will see how to execute it with CodeceptJS. We can enable Gherkin for current project by running `gherkin:init` command on **already initialized project**:

```
npx codeceptjs gherkin:init
```

It will add `gherkin` section to the current config. It will also prepare directories for features and step definition. And it will create the first feature file for you.

### Features

Whenever you start writing a story you are describing a specific feature of an application, with a set of scenarios and examples describing this feature. Let's open a feature file created by `gherkin:init` command, which is `feature/basic.feature`.

```gherkin
Feature: Business rules
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Scenario: do something
    Given I have a defined step
```

This text should be rewritten to follow your buisness rules. Don't think about a web interface for a while.
Think about how user interacts with your system and what goals they want to achieve. Then write interaction scenarios.

#### Scenarios

Scenarios are live examples of feature usage. Inside a feature file it should be written inside a *Feature* block. Each scenario should contain its title:

```gherkin
Feature: checkout
  In order to buy product
  As a customer
  I need to be able to checkout the selected products

Scenario: order several products
```

Scenarios are written in step-by-step manner using Given-When-Then approach. At start, scenario should describe its context with **Given** keyword:

```gherkin
  Given I have product with $600 price in my cart
  And I have product with $1000 price in my cart
```

Here we also use word **And** to extend the Given and not to repeat it in each line.

This is how we described the initial conditions. Next, we perform some action. We use **When** keyword for it:

```gherkin
  When I go to checkout process
```

And in the end we are verifying our expectation using **Then** keyword. The action changed the initial given state, and produced some results. Let's check that those results are what we actually expect.

```gherkin
  Then I should see that total number of products is 2
  And my order amount is $1600
```

This scenarios are nice as live documentation but they do not test anything yet. What we need next is to define how to run those steps.
Steps can be defined by executing `gherkin:snippets` command:

```bash
npx codeceptjs gherkin:snippets [--path=PATH] [--feature=PATH]
```

This will produce code templates for all undefined steps in the .feature files.
By default, it will scan all of the .feature files specified in the gherkin.features section of the config and produce code templates for all undefined steps. If the `--feature` option is specified, it will scan the specified .feature file(s).
The stub definitions by default will be placed into the first file specified in the gherkin.steps section of the config. However, you may also use `--path` to specify a specific file in which to place all undefined steps. This file must exist and be in the gherkin.steps array of the config.
Our next step will be to define those steps and transforming feature-file into a valid test.

### Step Definitions

Step definitions are placed in JavaScript file with Given/When/Then functions that map strings from feature file to functions:

```js
// use I and productPage via inject() function
const { I, productPage } = inject();

// you can provide RegEx to match corresponding steps
Given(/I have product with \$(\d+) price/, (price) => {
  I.amOnPage('/products');
  productPage.create({ price });
  I.click('Add to cart');
});

// or a simple string
When('I go to checkout process', () => {
  I.click('Checkout');
});

// parameters are passed in via Cucumber expressions
Then('I should see that total number of products is {int}', (num) => {
  I.see(num, '.cart');
});
Then('my order amount is ${int}', (sum) => { // eslint-disable-line
  I.see('Total: ' + sum);
});
```

Steps can be either strings or regular expressions. Parameters from string are passed as function arguments. To define parameters in a string we use [Cucumber expressions](https://docs.cucumber.io/cucumber/cucumber-expressions/)

To list all defined steps run `gherkin:steps` command:

```bash
npx codeceptjs gherkin:steps
```

To run tests and see step-by step output use `--steps` optoin:

```
npx codeceptjs run --steps
```

To see not only business steps but an actual performed steps use `--debug` flag:

```
npx codeceptjs run --debug
```

## Advanced Gherkin

Let's improve our BDD suite by using the advanced features of Gherkin language.

### Background

If a group of scenarios have the same initial steps, let's that for dashboard we need always need to be logged in as administrator. We can use *Background* section to do the required preparations and not to repeat same steps across scenarios.

```gherkin
Feature: Dashboard
  In order to view current state of business
  As an owner
  I need to be able to see reports on dashboard

  Background:
    Given I am logged in as administrator
    And I open dashboard page
```

Steps in background are defined the same way as in scenarios.

### Tables

Scenarios can become more descriptive when you represent repeating data as tables. Instead of writing several steps "I have product with :num1 $ price in my cart" we can have one step with multiple values in it.

```gherkin
  Given I have products in my cart
    | name         | category    | price  |
    | Harry Potter | Books       | 5      |
    | iPhone 5     | Smartphones | 1200   |
    | Nuclear Bomb | Weapons     | 100000 |
```

Tables are the recommended way to pass arrays into test scenarios.
Inside a step definition data is stored in argument passed as `DataTable` JavaScript object.
You can iterate on it like this:

```js
Given('I have products in my cart', (table) => { // eslint-disable-line
  for (const id in table.rows) {
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const name = cells[0].value;
    const category = cells[1].value;
    const price = cells[2].value;
    // ...
  }
});
```

You can also use the `parse()` method to obtain an object that allow you to get a simple version of the table parsed by column or row, with header (or not):

- `raw()` - returns the table as a 2-D array
- `rows()` - returns the table as a 2-D array, without the first row
- `hashes()` - returns an array of objects where each row is converted to an object (column header is the key)

If we use hashes() with the previous exemple :

```js
Given('I have products in my cart', (table) => { // eslint-disable-line
  //parse the table by header
  const tableByHeader = table.parse().hashes();
  for (const row in tableByHeader) {

    // take values
    const name = row.name;
    const category = row.category;
    const price = row.price;
    // ...
  }
});
```

### Examples

In case scenarios represent the same logic but differ on data, we can use *Scenario Outline* to provide different examples for the same behavior. Scenario outline is just like a basic scenario with some values replaced with placeholders, which are filled from a table. Each set of values is executed as a different test.

```gherkin
  Scenario Outline: order discount
    Given I have product with price <price>$ in my cart
    And discount for orders greater than $20 is 10 %
    When I go to checkout
    Then I should see overall price is "<total>" $

    Examples:
      | price | total |
      | 10    | 10    |
      | 20    | 20    |
      | 21    | 18.9  |
      | 30    | 27    |
      | 50    | 45    |
```

### Long Strings

Text values inside a scenarios can be set inside a `"""` block:

```gherkin
  Then i see in file "codecept.json"
"""
{
  "output": "./output",
  "helpers": {
    "Puppeteer": {
      "url": "http://localhost",
      "restart": true,
      "windowSize": "1600x1200"
    }
"""
```

This string can be accessed inside a `content` property of a last argument:

```js
Then('Then i see in file {string}', (file, text) => {
  // file is a value of {string} from a title
  const fileContent = fs.readFileSync(file).toString();
  fileContent.should.include(text.content); // text.content is a value
});
```

### Tags

Gherkin scenarios and features can contain tags marked with `@`. Tags are appended to feature titles so you can easily filter by them when running tests:

```bash
npx codeceptjs run --grep "@important"
```

Tag should be placed before *Scenario:* or before *Feature:* keyword. In the last case all scenarios of that feature will be added to corresponding group.

## Configuration

* `gherkin`
  * `features` - path to feature files
  * `steps` - array of files with step definitions

```js
"gherkin": {
  "features": "./features/*.feature",
  "steps": [
    "./step_definitions/steps.js"
  ]
}
```

## Before

You can set up some before hooks inside step definition files. Use `Before` function to do that.
This function receives current test as a parameter, so you can apply additional configuration to it.

```js
// inside step_definitions
Before((test) => {
  // perform your code
  test.retries(3); // retry test 3 times
});
```

This can be used to keep state between steps:

```js
let state = {};

// inside step_definitions
Before(() => {
  state = {};
});

Given('have a user', async () => {
  state.user = await I.have('user');
});

When('I open account page', () => {
  I.amOnPage(`/user/${state.user.slug}`);
})
```

## After

Similarly to `Before` you can use `After` and `Fail` inside a scenario. `Fail` hook is activated on failure and receive two parameters: `test` and current `error`.

```js
After(async () => {
  await someService.cleanup();
});

Fail((test, err) => {
  // test didn't
  console.log('Failed with', err);
  pause();
});
```

## Tests vs Features

It is common to think that BDD scenario is equal to test. But it's actually not. Not every test should be described as a feature. Not every test is written to test real business value. For instance, regression tests or negative scenario tests are not bringing any value to business. Business analysts don't care about scenario reproducing bug #13, or what error message is displayed when user tries to enter wrong password on login screen. Writing all the tests inside a feature files creates informational overflow.

In CodeceptJS you can combine tests written in Gherkin format with classical acceptance tests. This way you can keep your feature files compact with minimal set of scenarios, and write regular tests to cover all cases. Please note, feature files will be executed before tests.

To run only features use `--features` option:

```
npx codeceptjs run --features
```

You can run a specific feature file by its filename or by grepping by name or tag.

To run only tests without features use `--tests` option:

```
npx codeceptjs run --tests
```

