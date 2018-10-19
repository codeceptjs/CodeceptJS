# Robust Chrome Testing with Puppeteer

Among all Selenium alternatives the most interesting emerging ones are tools developed around Google Chrome [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). And the most prominent one is [Puppeteer](https://github.com/GoogleChrome/puppeteer).
It operates over Google Chrome directly without requireing additional tools like ChromeDriver. So tests setup with Puppeteer can be started with npm install only. If you want get faster and simpler to setup tests, Puppeteer would be your choice.

CodeceptJS uses Puppeteer to improve end to end testing experience. No need to learn the syntax of a new tool, all drivers in CodeceptJS share the same API.

Take a look at a sample test:

```js
I.amOnPage('https://github.com');
I.click('Sign in', '//html/body/div[1]/header');
I.see('Sign in to GitHub', 'h1');
I.fillField('Username or email address', 'something@totest.com');
I.fillField('Password', '123456');
I.click('Sign in');
I.see('Incorrect username or password.', '.flash-error');
```

It's readable and simple and works using Puppeteer API!

## Setup

To start you need CodeceptJS with Puppeteer packages installed

```bash
npm install -g codeceptjs puppeteer
```

Or see [alternative installation options](http://codecept.io/installation/)
If you already have CodeceptJS project, just install `puppeteer` package and enable it in config.

And a basic project initialized

```sh
codeceptjs init
```

You will be asked for a Helper to use, you should select Puppeteer and provide url of a website you are testing.

## Configuring

Make sure `Puppeteer` helper is enabled in `codecept.json` config:

```js
{ // ..
  "helpers": {
    "Puppeteer": {
      "url": "http://localhost",
      "show": false
    }
  }
  // ..
}
```

Turn on the `show` option if you want to follow test progress in a window. This is very useful for debugging.

Puppeteer uses different strategies to detect if a page is loaded. In configuration use `waitForNavigation` option for that:

By default it is set to `domcontentloaded` which waits for `DOMContentLoaded` event being fired. However, for Single Page Applications it's more useful to set this value to `networkidle0` which waits for all network connections to be finished.

```js
  "helpers": {
    "Puppeteer": {
      "url": "http://localhost",
      "waitForNavigation": "networkidle0"
    }
  }
```

When a test runs faster than application it is recommended to increase `waitForAction` config value.
It will wait for a small amount of time (100ms) by default after each user action is taken.

*More options are listed in [helper reference](http://codecept.io/helpers/Puppeteer/).*

## Writing Tests

CodeceptJS test should be created with `gt` command:

```sh
codeceptjs gt
```

As an example we will use `ToDoMvc` app for testing.

### Actions

Tests consist with a scenario of user's action taken on a page. The most widely used ones are:

* `amOnPage` - to open a webpage (accepts relative or absolute url)
* `click` - to locate a button or link and click on it
* `fillField` - to enter a text inside a field
* `selectOption`, `checkOption` - to interact with a form
* `wait*` to wait for some parts of page to be fully rendered (important for testing SPA)
* `grab*` to get values from page sources
* `see`, `dontSee` - to check for a text on a page
* `seeElement`, `dontSeeElement` - to check for elements on a page

*All actions are listed in [helper reference](http://codecept.io/helpers/Puppeteer/).*

All actions whicn interact with elements **support CSS and XPath locators**. Actions like `click` or `fillField` by locate elements by their name or value on a page:

```js

// search for link or button
I.click('Login');
// locate field by its label
I.fillField('Name', 'Miles');
// we can use input name
I.fillField('user[email]','miles@davis.com');
```

You can also specify the exact locator type with strict locators:

```js
I.click({css: 'button.red'});
I.fillField({name: 'user[email]'},'miles@davis.com');
I.seeElement({xpath: '//body/header'});
```

A complete ToDo-MVC test may look like:

```js
Feature('ToDo');

Scenario('create todo item', (I) => {
  I.amOnPage('http://todomvc.com/examples/react/');
  I.dontSeeElement('.todo-count');
  I.fillField('What needs to be done?', 'Write a guide');
  I.pressKey('Enter');
  I.see('Write a guide', '.todo-list');
  I.see('1 item left', '.todo-count');
});
```

### Grabbers

If you need to get element's value inside a test you can use `grab*` methods. They should be used with `await` operator inside `async` function:

```js
const assert = require('assert');
Scenario('get value of current tasks', async (I) => {
  I.createTodo('do 1');
  I.createTodo('do 2');
  let numTodos = await I.grabTextFrom('.todo-count strong');
  assert.equal(2, numTodos);
});
```

### Within

In case some actions should be taken inside one element (a container or modal window) you can use `within` block to narrow the scope.
Please take a note that you can't use within inside another within in Puppeteer helper:

```js
within('.todoapp', () => {
  I.createTodo('my new item');
  I.see('1 item left', '.todo-count');
  I.click('.todo-list input.toggle');
});
I.see('0 items left', '.todo-count');
```

CodeceptJS allows you to implement custom actions like `I.createTodo` or use **PageObjects**. Learn how to improve your tests in [PageObjects](http://codecept.io/pageobjects/) guide.

`within` can also work with [iframes](/acceptance/#iframes)

When running steps inside a within block will be shown with a shift:

![within](http://codecept.io/images/within.png)

## Extending

Puppeteer has a very [rich and flexible API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md). Sure, you can extend your test suites to use the methods listed there. CodeceptJS already prepares some objects for you and you can use them from your you helpers.

Start with creating an `MyPuppeteer` helper using `generate:helper` or `gh` command:

```sh
codeceptjs gh
```

Then inside a Helper you can access `Puppeteer` helper of CodeceptJS.
Let's say you want to create `I.renderPageToPdf` action. In this case you need to call `pdf` method of `page` object

```js
// inside a MyPuppeteer helper
async renderPageToPdf() {
  const page = this.helpers['Puppeteer'].page;
  await page.emulateMedia('screen');
  return page.pdf({path: 'page.pdf'});
}
```

The same way you can also access `browser` object to implement more actions or handle events. [Learn more about Helpers](http://codecept.io/helpers/) in the corresponding guide.

## done()

Yes, also the [demo project is available on GitHub](https://github.com/DavertMik/codeceptjs-todomvc-puppeteer)
