---
permalink: /testcafe
title: Testing with TestCafe
---

# Testing with TestCafe

[TestCafe](https://devexpress.github.io/testcafe/) is another alternative engine for driving browsers. It is driven by unique technology which provides fast and simple cross browser testing for desktop and mobile browsers. Unlike WebDriver or Puppeteer, TestCafe doesn't control a browser at all. It is not a browser itself, like [Nightmare](/nightmare) or Cypress. **TestCafe core is a proxy server** that runs behind the scene, and transforms all HTML and JS to include code that is needed for test automation.

![Testcafe](/img/testcafe.png)

This is very smart idea. But to use TestCafe on daily basis you need to clearly understand its benefits and limitations:

### Pros

* **Fast**. Browser is controlled from inside a web page. This makes test run inside a browser as fast as your browser can render page with no extra network requests.
* **Simple Cross-Browser Support.** Because TestCafe only launches browsers, it can **automate browser** on desktop or mobile. Unlike WebDriver, you don't need special version of browser and driver to prepare to run tests. Setup simplified. All you need is just a browser installed, and you are ready to go.
* **Stable to Execution.** Because a test is executed inside a browser, the network latency effects are reduced. Unlike WebDriver you won't hit stale element exceptions, or element not interactable exceptions, as from within a web browser all DOM elements are accessible.

## Cons

* **Magic.** Browsers executed in TestCafe are not aware that they run in test mode. So at some edges automation control can be broken. It's also quite hard to debug possible issues, as you don't know how actually a web page is parsed to inject automation scripts.
* **No Browser Control.** Because TestCafe do not control browser, you can't actually automate all users actions. For instance, TestCafe can't open new tabs or open a new browser window in incognito mode. There can be also some issues running tests on 3rd party servers or inside iframes.
* **Simulated Events.** Events like `click` or `doubleClick` are simulated by JavaScript internally. Inside WebDriver or Puppeteer, where those events are dispatched by a browser, called native events. Native events are closer to real user experience. So in some cases simulated events wouldn't represent actual user experience, which can lead to false positive results. For instance, a button which can't be physically clicked by a user, would be clickable inside TestCafe.

Anyway, TestCafe is a good option to start if you need cross browser testing. And here is the **reason to use TestCafe with CodeceptJS: if you hit an edge case or issue, you can easily switch your tests to WebDriver**. As all helpers in CodeceptJS share the same syntax.

CodeceptJS is a rich testing frameworks which also provides features missing in original TestCafe:

* [Cucumber integration](/bdd)
* [Real Page Objects](/pageobjects)
* [Data Management via API](/data)
* and others

## Writing Tests

To start using TestCafe with CodeceptJS install both via NPM

> If you don't have `package.json` in your project, create it with `npm init -y`.

```
npm i codeceptjs testcafe --save-dev
```

Then you need to initialize a project, selecting TestCafe when asked:

```
npx codeceptjs init
```

A first test should be created with `codeceptjs gt` command

```
npx codeceptjs gt
```

In the next example we will [TodoMVC application](http://todomvc.com/examples/angularjs/#/). So let's create a test which will fill in todo list:

```js
Feature('TodoMVC');

Scenario('create todo item', (I) => {
  I.amOnPage('http://todomvc.com/examples/angularjs/#/');
  I.fillField('.new-todo', todo)
  I.pressKey('Enter');
  I.seeNumberOfVisibleElements('.todo-list li', 1);
  I.see('1 item left', '.todo-count');
});
```

Same syntax is the same for all helpers in CodeceptJS so to learn more about available commands learn [CodeceptJS Basics](/basics).

> [▶ Complete list of TestCafe actions](/helpers/TestCafe)

## Page Objects

Multiple tests can be refactored to share some logic and locators. It is recommended to use PageObjects for this. For instance, in example above, we could create special actions for creating todos and checking them. If we move such methods in a corresponding object a test would look even clearer:

```js
Scenario('Create a new todo item', async (I, TodosPage) => {
  I.say('Given I have an empty todo list')

  I.say('When I create a todo "foo"')
  TodosPage.enterTodo('foo')

  I.say('Then I see the new todo on my list')
  TodosPage.seeNumberOfTodos(1)

  I.saveScreenshot('create-todo-item.png')
})

Scenario('Create multiple todo items', async (I, TodosPage) => {
  I.say('Given I have an empty todo list')

  I.say('When I create todos "foo", "bar" and "baz"')
  TodosPage.enterTodo('foo')
  TodosPage.enterTodo('bar')
  TodosPage.enterTodo('baz')

  I.say('Then I have these 3 todos on my list')
  TodosPage.seeNumberOfTodos(3)

  I.saveScreenshot('create-multiple-todo-items.png')
})
```

> ℹ [Source code of this example](https://github.com/hubidu/codeceptjs-testcafe-todomvc) is available on GitHub.

A PageObject can be injected into a test by its name. Here is how TodosPage looks like:

```js
// inside todos_page.js
const { I } = inject();

module.exports = {
    goto() {
        I.amOnPage('http://todomvc.com/examples/angularjs/#/')
    },

    enterTodo(todo) {
        I.fillField('.new-todo', todo)
        I.pressKey('Enter')
    },

    seeNumberOfTodos(numberOfTodos) {
        I.seeNumberOfVisibleElements('.todo-list li', numberOfTodos)
    },
}
```

> [▶ Read more about PageObjects in CodeceptJS](/pageobjects)

## Extending

If you want to use TestCafe API inside your tests you can put them into actions of `I` object. To do so you can generate a new helper, access TestCafe helper, and get the test controller.

Create a helper using `codecepjs gh` command.

```
npx codeceptjs gh
```

All methods of newly created class will be added to `I` object.

```js
const Helper = codeceptjs.helper;

class MyTestCafe extends Helper {

  slowlyFillField(field, text) {
    // import test controller from TestCafe helper
    const { t } = this.helpers.TestCafe;
    // use TestCafe API here
    return t.setTestSpeed(0.1)
        .typeText(field, text);
  }

}
```
