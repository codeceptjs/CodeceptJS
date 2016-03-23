## AngularJS E2E Testing with CodeceptJS

### Introduction

One goal of CodeceptJS in diversified world of JavaScript testing libraries is to create unified high level API for end-to-end testing, powered by differnet backends.
CodeceptJS allows you to write a test and switch in config execution drivers: will it be wedriverio, selenium-webdriver, or protractor.
This way you won't be bound to implementation, and your acceptance tests will work no matter of framework running behind them.

As you know, [Protractor](http://www.protractortest.org/#/) is an official tool for testing AngularJS applications.
CodeceptJS should not be considerend as alternative to Protractor, but a testing framework utilizing this powerful library.

So there is no magic in testing of AngularJS application in CodeceptJS.
You just execute regular Protractor commands, packed in a simple high-level API.

As an example we will use popular [TodoMVC application](http://todomvc.com/examples/angularjs/#/).
How would we test creating a new Todo item in CodeceptJS?

```js
Scenario('create todo item', (I) => {
  I.amOnPage('/');
  I.dontSeeElement('#todo-count');
  I.fillField({model: 'newTodo'}, 'Write a guide');
  I.pressKey('Enter');
  I.see('Write a guide', {repeater: "todo in todos"});
  I.see('1 item left', '#todo-count');
});
```

The similar test written in native syntax of Protractor (inherited from selenium-webdriver) would look like:

```js
it('should create todo item', (I) => {
  browser.get("http://todomvc.com/examples/angularjs/#/");
  expect(element(by.css("#todo-count")).isPresent()).toBeFalsy();
  var inputField = element(by.model("newTodo"));
  inputField.sendKeys("Write a guide");
  inputField.sendKeys(protractor.Key.ENTER);
  var todos = element.all(by.repeater("todo in todos"));
  expect(todos.last().getText()).toEqual("Write a guide"));
  element(by.css("#todo-count")).getText()).toContain('1 items left');
});
```
Comparing to the API proposed by CodeceptJS, this code looks a bit more complicated.
But what the more important, it's really really hard to read and follow its logic.
Readability is the most crucial part in acceptance testing.
You should easily change tests when changes specification or design.
Probably, only a person who writes Protractor tests in your company,
could do those changes, while CodeceptJS allows anyone to work with tests.
Contrary, CodeceptJS provides CodeceptJS provides scenario-driven approach, so test is just a step-by-step representation of real user actions.
This way you can easily read, and follow test scenario, and edit it when you need it to be changed.

In this way CodeceptJS is more similar to Cucumber, so if you run a test with `--steps` option you will see this output:

```bash
TodoMvc --
 create todo item
 • I am on page "/"
 • I dont see element "#todo-count"
 • I fill field {"model":"newTodo"}, "Write a guide"
 • I press key "Enter"
 • I see "Write a guide", {"repeater":"todo in todos"}
 • I see "1 item left", "#todo-count"
 ✓ OK in 968ms
```

Unlike Cucumber, CodeceptJS is not about writing test scenarios above for business rules.
To say it again, its **goal is to provide standard action steps you can use for testing applications**.
Surely, it can't cover 100% of cases but it aims for 90%, for others you can write your own steps inside a [custom Helper](http://codecept.io/helpers/) using API of Protractor

### Setting up CodeceptJS with Protractor

To start using CodeceptJS you will need to install it via NPM and initialize it in directory with tests.

```bash
npm install -g codeceptjs
codeceptjs init
```

You will be asked questions about initial configuration, make sure you select Protractor helper.
If you didn't have Protracotr library it **will be installed**.
Please agree to extend steps, and use `http://todomvc.com/examples/angularjs/` as a url for Protractor helper.

For TodoMVC application you will have following config created in `codecept.json` file:

```json
{
  "tests": "./*_test.js",
  "timeout": 10000,
  "output": "./output",
  "helpers": {
    "Protractor": {
      "url": "http://todomvc.com/examples/angularjs/",
      "driver": "hosted",
      "browser": "firefox",
      "rootElement": "body"
    }
  },
  "include": {
    "I": "./steps_file.js"
  },
  "bootstrap": false,
  "mocha": {},
  "name": "todoangular"
}
```

First test can be generated with `gt` command:

```bash
codeceptjs gt
```

After that you can start writing your first CodeceptJS/Angular tests.
Please look into the reference of [Protractor helper])(http://codecept.io/helpers/Protractor/) for all available actions.
You can also run `list` command to see methods of I:

```bash
codeceptjs list
```

### Writing First Test

Test scenario should always use `I` object to execute commands.
This is important as all methods of `I` are running in global promise chain, this way CodeceptJS makes sure everything is executed in right order.
At first a page should be opened to proceed, we use `amOnPage` command for that. As we already specified full URL to TodoMVC app,
we can pass relative path into it instead of absolute url:

```js
Feature('Todo MVC');

Scenario('create todo item', (I) => {
  I.amOnPage('/');
});
```

All scenarios should describe actions on site and assertions taken in the end. In CodeceptJS assertion commands have `see` or `dontSee` prefix:

```js
Feature('Todo MVC');

Scenario('create todo item', (I) => {
  I.amOnPage('/');
  I.dontSeeElement('#todo-count');
});
```

A test can be executed with `run` command, we recommend to use `--steps` options to follow step-by-step execution:

```
$ codeceptjs run --steps

CodeceptJS v0.3.2
Test root is assumed to be /home/davert/demos/todoangular
Using the selenium server at http://localhost:4444/wd/hub

TodoMvc --
 create todo item
 • I am on page "/"
 • I dont see element "#todo-count"
```

### Running Several Scenarios

By writing a test in similar manner we will have a test shown in the beginning of this guide. Probably we would like not to finish with one test,
but have more, for testing editing of todo items, checking todo items, and more.

Let's prepare our test for multiple scenarios. All test scenarios will need to open main page of application, so `amOnPage` can be moved into the `Before` hook:
Scenarios will probably deal with created todo items, so we can move logic of crating new todo into a function.

```js
Feature('TodoMvc');

Before((I) => {
  I.amOnPage('/');
});

var createTodo = function (I, name) {
  I.fillField({model: 'newTodo'}, name);
  I.pressKey('Enter');
}

Scenario('create todo item', (I) => {
  I.dontSeeElement('#todo-count');
  createTodo(I, 'Write a guide');
  I.see('Write a guide', {repeater: "todo in todos"});
  I.see('1 item left', '#todo-count');
});
```

and so we can add even more tests!

```js
Scenario('edit todo', (I) => {
  createTodo(I, 'write a review');
  I.see('write a review', {repeater: "todo in todos"});
  I.doubleClick('write a review');
  I.pressKey(['Control', 'a']);
  I.pressKey('write old review');
  I.pressKey('Enter');
  I.see('write old review', {repeater: "todo in todos"});
});

Scenario('check todo item', (I) => {
  createTodo(I, 'my new item');
  I.see('1 item left', '#todo-count');
  I.checkOption({model: 'todo.completed'});
  I.see('0 items left', '#todo-count');
});
```

### Locators

Like you may've noticed, CodeceptJS doesn't use `by.*` locators similar to Protractor or Selenium Webdriver.
Instead most of methods expect you to pass valid CSS or XPath. In case you don't want CodeceptJS to guess the type of locator,
you can specify them using so-called strict locators. This is an absolute analogy of `by`, so you can use angular specific locators (like models, repeaters, bindings, etc) in it:

```
{css: 'button'}
{repeater: "todo in todos"}
{binding: 'latest'}
```
When we deal with clicks, CodeceptJS can take a text and search a web page for a valid clickable element with that text.
So links and buttons can be searched by their text.

Same thing happens for form fields: they are searched by field names, labels, and so on.

Using such smart locators makes tests easy to write, however, searching an element by text is slower than using CSS|XPath and much slower than using strict locators.

### Refactoring

In previous examples, we've moved actions into `createTodo` funciton. Is there a more elegant way of refactoring?
Can we have something like `I.createTodo()` to be used in code? Sure, we can do so by editing `steps_file.js` created by init command.

```js
'use strict';
// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({
    createTodo: function(title) {
      this.fillField({model: 'newTodo'}, title);
      this.pressKey('Enter');
    }
  });
}
```
And that's all, method is available to use as `I.createTodo(title)`:

```js
Scenario('create todo item', (I) => {
  I.dontSeeElement('#todo-count');
  createTodo(I, 'Write a guide');
  I.see('Write a guide', {repeater: "todo in todos"});
  I.see('1 item left', '#todo-count');
});
```

To learn more about refactoring options in CodeceptJS read [PageObjects guide](http://codecept.io/pageobjects/).

### done()