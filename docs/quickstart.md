---
permalink: quickstart
title: Quickstart
layout: Section
sidebar: true
---

# Quickstart

Install CodeceptJS into your project:

```
npm install codeceptjs playwright --save-dev
```

Then install the browser binaries:

```
npx playwright install --with-deps
```

The `--with-deps` flag also installs required system dependencies for the browsers.

> Prefer WebDriver or Appium? See [installation options](/installation/) for all supported helpers.

---

### Init

Initialize CodeceptJS to set up the config file and test directory:

```
npx codeceptjs init
```

This command walks you through a short setup wizard and creates `codecept.conf.js`, a sample test file, and any required browser binaries.

Answer the questions, accepting defaults to get started quickly:

| Question | Default Answer  | Alternative
|---|---|---|
| Do you plan to write tests in TypeScript?  | **n** (No)  | or [learn how to use TypeScript](/typescript)
| Where are your tests located? | `**./*_test.js` | or any glob pattern like `**.spec.js`
| What helpers do you want to use? | **Playwright** | See options for [web testing](https://codecept.io/basics/#architecture), [mobile testing](https://codecept.io/mobile/), [API testing](https://codecept.io/api/)
| Where should logs, screenshots, and reports be stored? | `./output` | path to store artifacts and temporary files

For Playwright, you'll also be asked about the site and browser:

| Question | Default Answer  | Alternative
|---|---|---|
| Base url of site to be tested | http://localhost | URL of the site you plan to test
| Show browser window | **y** Yes | or run in **headless mode**
| Browser | **chromium** | or `firefox`, `webkit` (open-source Safari), or `electron`

Sample output:

```
? Do you plan to write tests in TypeScript? No
? Where are your tests located? **./*_test.js
? What helpers do you want to use? Playwright
? Where should logs, screenshots, and reports be stored? ./output
? [Playwright] Base url of site to be tested http://localhost
? [Playwright] Show browser window Yes
? [Playwright] Browser in which testing will be performed chromium
```

When asked, create your first feature and test file.

---

### Write Your First Test

Open the generated test file. It will look like this:

```js
Feature('My First Test');

Scenario('test something', ({ I }) => {

});
```

Add a simple scenario:

```js
Feature('My First Test');

Scenario('test something', ({ I }) => {
  I.amOnPage('https://github.com');
  I.see('GitHub');
});
```

---

### Run Tests

```
npx codeceptjs run
```

Expected output:

```bash
My First Test --
  test something
     I am on page "https://github.com"
     I see "GitHub"
 ✓ OK
```

Run in headless mode:

```
npx codeceptjs run --p browser:hide
```

See all available commands in the [CLI reference](https://codecept.io/commands/).

> [▶ Next: CodeceptJS Basics](/basics/)
