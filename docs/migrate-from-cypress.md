---
permalink: /migrate-from-cypress
title: Migrate from Cypress to CodeceptJS
---

# Migrate from Cypress to CodeceptJS

## Start here: what Cypress boxes you into

A Cypress test runs inside the browser, in the same tab as your app. That keeps a simple test short, but it fixes the test to one tab, one browser, and one origin. A second tab, a second logged-in user, a different domain, or an API call between two clicks each needs a special workaround: `cy.origin`, `cy.session`, request plumbing, tab stubbing. Cross-browser is limited the same way: Chromium first, WebKit partial.

CodeceptJS runs the test in Node and controls the browser from the outside. The test is a normal Node script, so a second tab, a second user, an API call in the middle of a flow, and Firefox or WebKit are ordinary steps instead of workarounds. It drives the browser through Playwright by default, or Puppeteer or WebDriver if you prefer.

Migrating a Cypress suite looks like a lot of work. It is not. We prepared a set of skills, so you can relax and [let an agent do the migration](#let-an-agent-do-the-migration).

## Comparison

The original test in Cypress:

```js
// Cypress
it('user can log in', () => {
  cy.visit('/login');
  cy.get('#username').type('alice');
  cy.get('#password').type('secret');
  cy.contains('Sign in').click();
  cy.url().should('include', '/dashboard');
  cy.contains('.welcome', 'Welcome, Alice');
});
```

Will look in CodeceptJS:

```js
// CodeceptJS
Scenario('user can log in', ({ I }) => {
  I.amOnPage('/login');
  I.fillField('Username', 'alice');
  I.fillField('Password', 'secret');
  I.click('Sign in');
  I.seeInCurrentUrl('/dashboard');
  I.see('Welcome, Alice', '.welcome');
});
```

Cypress commands run on a `.then()` queue, so any condition or loop becomes nested callbacks. CodeceptJS is **async/await native**: complex tests stay flat JavaScript, and shared steps move into built-in page objects.

And here is how the test looks while it runs. Every step is printed live, in the same order it was written:

```text
user can log in
  I am on page "/login"
  I fill field "Username", "alice"
  I fill field "Password", "secret"
  I click "Sign in"
  I see in current url "/dashboard"
  I see "Welcome, Alice", ".welcome"
```

When a step fails, the output stays on that line, with the locator that missed and a screenshot attached. There is no separate report step before you know what happened.

## Let an agent do the migration

The conversions are mechanical, so you do not have to do them by hand, and the work does not cost you working time. Install the skills bundle, point an agent at the repo, and check back when it reports.

The **`migrate-cypress-to-codeceptjs`** skill in the [CodeceptJS skills bundle](https://github.com/codeceptjs/skills) does the whole port:

1. Inventories the shared logic, custom commands, and page modules.
2. Sets up CodeceptJS beside the Cypress suite.
3. Ports the custom commands and page objects.
4. Converts each spec.
5. Runs the full suite.

First runs fail, because locators drift and timing changes. The agent then uses the `debugging-codeceptjs-tests` skill to fix each failure against the live browser before moving on. Your Cypress suite keeps running in CI until the port is green, so nothing is at risk while the agent works.

Install the bundle in Claude Code:

```text
/plugin marketplace add codeceptjs/skills
/plugin install codeceptjs@codeceptjs-skills
```

Or any other agent:

```bash
npx skills add codeceptjs/skills
```

Then ask: *"Migrate this Cypress suite to CodeceptJS."* The skill triggers on the Cypress signatures in your repo. Start it, do other work, and read the step output when it reports back.

## Pointers

- [/agents](/agents) for how the agent and MCP loop works
- [/playwright](/playwright) for the default helper in this migration
- [/locators](/locators) for semantic, ARIA, and `locate()` locators
- [/auth](/auth) for replacing `cy.session()` and programmatic login
- [/api](/api) for the REST helper used in `cy.request` ports
- [/pageobjects](/pageobjects) for ported page objects
