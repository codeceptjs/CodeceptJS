---
permalink: /migrate-from-testcafe
title: Migrate from TestCafe to CodeceptJS
---

# Migrate from TestCafe to CodeceptJS

## Start here: what the proxy costs you

TestCafe does not drive a browser through a driver. It runs a proxy in front of the browser, rewrites every page and script as they load, and injects its automation into the rewritten page. That worked when it was built, but the web platform now fights it. Content Security Policy blocks the injected script. HSTS, SameSite cookies, and COOP/COEP assume the origin the browser actually requested, not a proxied one. Service workers cache the rewritten responses. The proxy has more to paper over every release, and every action in a test needs its own `await` because each one is a round trip through the injected runtime.

CodeceptJS drives a real browser through a driver: Playwright over CDP, across the same Chromium, Firefox, and WebKit engines TestCafe targeted, with nothing in the request path. The page the test sees is the page the server sent, so there is nothing to rewrite and nothing for the platform to break. Actions queue internally, so they read top to bottom without `await` on every line.

Migrating a TestCafe suite looks like a lot of work. It is not. We prepared a set of skills, so you can relax and [let an agent do the migration](#let-an-agent-do-the-migration).

## Comparison

The original test in TestCafe:

```js
// TestCafe
fixture`Login`.page`https://example.com/login`;

test('user can log in', async t => {
  await t.typeText(Selector('#username'), 'alice');
  await t.typeText(Selector('#password'), 'secret');
  await t.click(Selector('button').withText('Sign in'));
  await t.expect(getLocation()).contains('/dashboard');
  await t.expect(Selector('.welcome').innerText).contains('Welcome, Alice');
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

Every `await`, every `t`, and every `Selector` is gone. The steps read as a sequence instead of a chain of awaited calls.

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

The **`migrate-testcafe-to-codeceptjs`** skill in the [CodeceptJS skills bundle](https://github.com/codeceptjs/skills) does the whole port:

1. Inventories the shared logic: `Role` setup, `ClientFunction` wrappers, page models, and request mocks.
2. Sets up CodeceptJS beside the TestCafe suite with the Playwright helper.
3. Ports the abstractions into custom helpers and page objects.
4. Converts each spec.
5. Runs the full suite.

First runs fail, because locators drift and timing changes. The agent then uses the `debugging-codeceptjs-tests` skill to fix each failure against the live browser before moving on. Your TestCafe suite keeps running in CI until the port is green, so nothing is at risk while the agent works.

Install the bundle in Claude Code:

```text
/plugin marketplace add codeceptjs/skills
/plugin install codeceptjs@codeceptjs-skills
```

Or any other agent:

```bash
npx skills add codeceptjs/skills
```

Then ask: *"Migrate this TestCafe suite to CodeceptJS."* The skill triggers on the TestCafe signatures in your repo. Start it, do other work, and read the step output when it reports back.

## Pointers

- [/agents](/agents) for how the agent and MCP loop works
- [/playwright](/playwright) for the default helper in this migration
- [/locators](/locators) for semantic, ARIA, and `locate()` locators in place of `Selector` chains
- [/auth](/auth) for the plugin that replaces `Role` and `t.useRole`
- [/api](/api) for the REST helper used in API testing
- [/pageobjects](/pageobjects) for ported page objects
