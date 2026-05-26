---
permalink: /tutorial
title: CodeceptJS Complete Tutorial
---

# Tutorial: Testing a Checkout Page

**[CodeceptJS](https://codecept.io) is a popular open-source end-to-end testing framework** for JavaScript. It is designed to make web tests readable and easy to maintain by writing them as a linear scenario of user actions. By default it drives the browser with **[Playwright](https://playwright.dev)**, but the same tests can run via WebDriver, Puppeteer, or Appium without changes.

In this tutorial we write a real, runnable test for the **[Bootstrap checkout example](https://getbootstrap.com/docs/4.0/examples/checkout/)** — a public page with a billing and payment form. By the end you will have a clean test and a reusable page object.

## Install CodeceptJS

You need Node.js (and npm) installed. Check with:

```bash
node --version
npm --version
```

Create a new folder, then install CodeceptJS together with Playwright:

```bash
npm init -y
npm install codeceptjs playwright --save-dev
npx playwright install --with-deps
```

`npx playwright install` downloads the Chromium, Firefox, and WebKit browsers; `--with-deps` also installs the system libraries they need.

Now scaffold the project:

```bash
npx codeceptjs init
```

`init` runs a short wizard. Accept the defaults — when asked for the **base URL** enter `https://getbootstrap.com`, and name the first test **Checkout**. This creates:

```
.
├── codecept.conf.js
├── package.json
└── Checkout_test.js
```

`codecept.conf.js` holds the project configuration. Because CodeceptJS 4.x uses **ES modules**, the config and tests use `import`/`export` syntax — `init` sets `"type": "module"` in `package.json` for you.

Open `codecept.conf.js`. The two settings that matter here are the helper and the base URL:

```js
import { setHeadlessWhen } from '@codeceptjs/configure'

// show the browser locally, run headless on CI
setHeadlessWhen(process.env.CI)

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    Playwright: {
      url: 'https://getbootstrap.com',
      browser: 'chromium',
    },
  },
}
```

## Your First Test

Open `Checkout_test.js`:

```js
Feature('Checkout');

Scenario('test something', ({ I }) => {
});
```

A test lives inside a `Scenario` block. Let's open the checkout page:

```js
Feature('Checkout');

Scenario('test something', ({ I }) => {
  I.amOnPage('/docs/4.0/examples/checkout/');
});
```

`I.amOnPage()` navigates the browser. Because the path is relative, it is appended to the base URL from the config — keep the base URL in config so you can switch between staging and production without touching tests.

But you may be wondering...

### What is `I`?

In CodeceptJS the `I` object is the **actor** — it represents the user performing actions. It exposes methods (called *actions*) that simulate interactions with the app:

- `I.amOnPage(url)` — navigate to a URL
- `I.click(locator)` — click an element
- `I.fillField(field, value)` — type into an input
- `I.selectOption(select, option)` — choose an option in a dropdown
- `I.checkOption(locator)` — tick a checkbox or radio
- `I.see(text)` — assert that text is visible
- `I.seeInField(field, value)` — assert an input holds a value

CodeceptJS **waits automatically** before clicking, filling, and most other actions, so you rarely need explicit waits. Steps also write themselves into a promise chain, so you usually **don't need `await`** for regular actions — only for `grab*` actions and page object methods that return data.

### Locating Elements

Most actions accept a locator. CodeceptJS supports several strategies — prefer the readable ones:

```js
// by visible text / label
I.click('Continue to checkout');
I.fillField('First name', 'John');

// by ARIA role and accessible name (resilient to CSS changes)
I.click({ role: 'button', name: 'Continue to checkout' });

// by CSS or XPath, when nothing semantic is available
I.fillField('#email', 'john@example.com');
```

> **Best practice:** prefer labels and ARIA locators (`{ role, name }`). They survive styling changes and document intent. Fall back to CSS/XPath only when needed.

## Writing the Checkout Test

The Bootstrap checkout form has billing fields, country/state selects, and a payment section. CodeceptJS finds inputs by their visible `<label>`, so the test reads like the form:

```js
Feature('Checkout');

Scenario('fill in the checkout form', ({ I }) => {
  I.amOnPage('/docs/4.0/examples/checkout/');
  I.see('Checkout form');

  // billing address — fields located by their labels
  I.fillField('First name', 'John');
  I.fillField('Last name', 'Doe');
  I.fillField('Username', 'johndoe');
  I.fillField('#email', 'john@example.com'); // label has "(Optional)", use CSS
  I.fillField('Address', '123 Main St.');
  I.selectOption('Country', 'United States');
  I.selectOption('State', 'California');
  I.fillField('Zip', '10001');

  // shipping / preferences
  I.checkOption('Shipping address is the same as my billing address');
  I.checkOption('Save this information for next time');

  // payment — "Credit card" is selected by default
  I.click('Credit card');
  I.fillField('Name on card', 'John Doe');
  I.fillField('Credit card number', secret('4111 1111 1111 1111'));

  // verify the form holds what we entered
  I.seeInField('First name', 'John');
  I.seeInField('Address', '123 Main St.');
  I.click('Continue to checkout');
});
```

A few things worth noting:

- **`secret()`** wraps the card number so it is masked (`****`) in logs and reports. Use it for any sensitive value — see [Secrets](/secrets).
- Never use a real card number. Payment providers like Stripe publish [test card numbers](https://docs.stripe.com/testing) for exactly this.
- This is a static demo page with no backend, so we verify by reading field values back with `I.seeInField`. On a real shop you would assert a confirmation, e.g. `I.see('Your order has been placed')`.

### A Negative Scenario

Good test suites cover failures too. The form validates on submit — submitting it empty shows error messages. CodeceptJS doesn't allow multiple scenarios in one file's suite to nest, but you can add as many `Scenario` blocks as you like:

```js
Scenario('shows validation errors on empty submit', ({ I }) => {
  I.amOnPage('/docs/4.0/examples/checkout/');
  I.click('Continue to checkout');
  I.see('Valid first name is required.');
});
```

### Running the Test

```bash
npx codeceptjs run --steps
```

`--steps` prints every step as it runs. Useful flags while developing:

- `--steps` — print each step
- `--debug` — steps plus extra debug output (recommended while writing tests)
- `--verbose` — everything, including the promise chain

Set a breakpoint to inspect the page interactively by adding `pause()` to the scenario:

```js
Scenario('fill in the checkout form', ({ I }) => {
  I.amOnPage('/docs/4.0/examples/checkout/');
  I.fillField('First name', 'John');
  pause(); // test stops here; type steps live in the browser
});
```

In the pause shell you can type `I.click('...')`, inspect the page, and find better locators. See [Debugging](/debugging).

The browser is shown locally and runs headless on CI thanks to `setHeadlessWhen(process.env.CI)`. To force it either way for one run:

```bash
npx codeceptjs run --headless
```

Once the test is stable, run the whole suite:

```bash
npx codeceptjs run
```

## Refactoring with a Page Object

What if more tests need to fill this form? Copy-pasting steps doesn't scale. The **Page Object** pattern keeps locators and interactions in one reusable place.

Generate one:

```bash
npx codeceptjs gpo
```

Call it `Checkout`. It is created in `./pages/Checkout.js` and registered in `codecept.conf.js` under `include`:

```js
export const config = {
  // ...
  include: {
    checkoutPage: './pages/Checkout.js',
  },
}
```

Page objects are **classes**. Move the form interactions into named methods:

```js
const { I } = inject();

class CheckoutPage {
  url = '/docs/4.0/examples/checkout/'

  open() {
    I.amOnPage(this.url);
    I.see('Checkout form');
  }

  fillBillingAddress({ firstName, lastName, username, address, country, state, zip }) {
    I.fillField('First name', firstName);
    I.fillField('Last name', lastName);
    I.fillField('Username', username);
    I.fillField('Address', address);
    I.selectOption('Country', country);
    I.selectOption('State', state);
    I.fillField('Zip', zip);
  }

  payWithCard(name, number) {
    I.click('Credit card');
    I.fillField('Name on card', name);
    I.fillField('Credit card number', secret(number));
  }

  submit() {
    I.click('Continue to checkout');
  }
}

export default CheckoutPage
```

> `inject()` returns a lazy proxy, so it's safe to destructure `I` before the class. Export the **class** — CodeceptJS auto-instantiates it. (Plain-object page objects still work but classes support lifecycle hooks and inheritance.)

The test now reads at the business level. Inject `checkoutPage` by the name you set in the config:

```js
Feature('Checkout');

Scenario('complete a checkout', ({ I, checkoutPage }) => {
  checkoutPage.open();
  checkoutPage.fillBillingAddress({
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    address: '123 Main St.',
    country: 'United States',
    state: 'California',
    zip: '10001',
  });
  checkoutPage.payWithCard('John Doe', '4111 1111 1111 1111');
  checkoutPage.submit();

  I.seeInField('First name', 'John');
});
```

Shorter, intention-revealing, and every other checkout test can reuse the same methods. As coverage grows, add methods to the page object instead of duplicating steps.

## Going Further

When you have many tests, run them in parallel using Node workers:

```bash
npx codeceptjs run-workers 3
```

From here, explore:

- [Locators](/locators) — every locating strategy in depth
- [Page Objects](/pageobjects) — fragments, step objects, lifecycle hooks
- [Data-driven tests](/data) — run one scenario over many inputs
- [Debugging](/debugging) — `pause()`, the interactive shell, and AI-assisted debugging
- [Continuous Integration](/continuous-integration) — running the suite on CI

## Summary

If you are just starting with test automation, CodeceptJS lets you describe tests in near-natural language and handles waiting and retries for you. If you already know JavaScript, page objects and dependency injection keep your suite focused on business behavior — which is what keeps tests stable and maintainable as the app grows.

> [▶ Next: CodeceptJS Basics](/basics/)
</content>
</invoke>
