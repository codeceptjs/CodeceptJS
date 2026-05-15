---
permalink: /migrate-from-protractor
title: Migrate from Protractor to CodeceptJS
---

# Migrate from Protractor to CodeceptJS

## Start here: a dead dependency with an Angular wrapper

Protractor was end-of-lifed in April 2023 and has shipped nothing since. Its design wrapped Selenium with two things: `waitForAngular`, which blocked each action until Angular's digest cycle settled, and the ControlFlow promise manager, which ordered commands so test code could be written as if it were synchronous. That is why a Protractor suite pins an old Selenium version and threads results through `.then()`. The dependency only ages from here.

CodeceptJS drops the Angular coupling. The helper waits on the element you are acting on, not on Angular's digest, so the same test works on an Angular app, a React app, or a static page. It still speaks the WebDriver protocol, so an existing Selenium Grid keeps serving the new suite, or you switch the config to Playwright and run the same test code faster.

Migrating a Protractor suite looks like a lot of work. It is not. We prepared a set of skills, so you can relax and [let an agent do the migration](#let-an-agent-do-the-migration).

## Comparison

The original test in Protractor:

```js
// Protractor + Jasmine
describe('login', function () {
  it('user can log in', function () {
    browser.get('https://example.com/login');
    element(by.model('user.email')).sendKeys('alice@example.com');
    element(by.model('user.password')).sendKeys('secret');
    element(by.css('button[type=submit]')).click();
    expect(browser.getCurrentUrl()).toContain('/dashboard');
    expect(element(by.css('.welcome')).getText()).toContain('Welcome, Alice');
  });
});
```

Will look in CodeceptJS:

```js
// CodeceptJS
Scenario('user can log in', ({ I }) => {
  I.amOnPage('/login');
  I.fillField('Email', 'alice@example.com');
  I.fillField('Password', 'secret');
  I.click('Sign in');
  I.seeInCurrentUrl('/dashboard');
  I.see('Welcome, Alice', '.welcome');
});
```

The `describe`/`it` nesting, the `by.model` strategy, and the Jasmine assertions are gone. The steps read as a sequence instead of a chain of `.then()` calls.

And here is how the test looks while it runs. Every step is printed live, in the same order it was written:

```text
user can log in
  I am on page "/login"
  I fill field "Email", "alice@example.com"
  I fill field "Password", "secret"
  I click "Sign in"
  I see in current url "/dashboard"
  I see "Welcome, Alice", ".welcome"
```

When a step fails, the output stays on that line, with the locator that missed and a screenshot attached. There is no separate report step before you know what happened.

## Let an agent do the migration

The conversions are mechanical, so you do not have to do them by hand, and the work does not cost you working time. Install the skills bundle, point an agent at the repo, and check back when it reports.

The **`migrate-protractor-to-codeceptjs`** skill in the [CodeceptJS skills bundle](https://github.com/codeceptjs/skills) does the whole port:

1. Inventories the page objects, shared helpers, and config hooks.
2. Sets up CodeceptJS beside the Protractor suite.
3. Ports the page objects and helpers.
4. Converts each spec.
5. Runs the full suite.

First runs fail, because locators drift and timing changes. The agent then uses the `debugging-codeceptjs-tests` skill to fix each failure against the live browser before moving on. Your Protractor suite keeps running in CI until the port is green, so nothing is at risk while the agent works.

Install the bundle in Claude Code:

```text
/plugin marketplace add codeceptjs/skills
/plugin install codeceptjs@codeceptjs-skills
```

Or any other agent:

```bash
npx skills add codeceptjs/skills
```

Then ask: *"Migrate this Protractor suite to CodeceptJS."* The skill triggers on the Protractor signatures in your repo. Start it, do other work, and read the step output when it reports back.

## Pointers

- [/agents](/agents) for how the agent and MCP loop works
- [/playwright](/playwright) for the recommended target helper
- [/webdriver](/webdriver) for the target if you keep a Selenium Grid
- [/locators](/locators) for semantic, ARIA, `locate()`, and the `customLocator` plugin
- [/pageobjects](/pageobjects) for ported Protractor page objects
- [/auth](/auth) for programmatic login and session reuse
- [/api](/api) for the REST helper used in HTTP-call ports
