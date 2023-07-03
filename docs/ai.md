---
permalink: /ai
title: Testing with AI 🪄 
---

**CodeceptJS is the first open-source test automation framework with AI** features to improve the testing experience. CodeceptJS uses OpenAI GPT to auto-heal failing tests, assist in writing tests, and more...

Think of it as your testing co-pilot built into the testing framework

> 🪄 **AI features for testing are experimental**. AI works only for web based testing with Playwright, WebDriver, etc. Those features will be improved based on user's experience.


## How AI Improves Automated Testing

ChatGPT can write automated tests for you. What you need is just ask it "How to write CodeceptJS test" and it will generate the code that can be executed but not the actual code you need. ChatGPT misses the context, of your application. 

CodeceptJS uses OpenAI API to send the prompt and share the HTML context of a page. So, it can ask: how to write a test for **this** page. GPT model knows how to write CodeceptJS code, how to build good-looking semantic locators and how to analyze HTML to match them. Even more, GPT suggestions can be tested in real-time in a browser, making a feedback loop.

CodeceptJS AI can do the following:

* 🏋️‍♀️ **assist writing tests** in `pause()` or interactive shell mode
* 🚑 **self-heal failing tests** (can be used on CI)
* 💬 send arbitrary prompts to GPT from any tested page attaching its HTML contents

![](/images/fill_form.gif)

### How it works

As we can't send a browser window with ChatGPT we are not be able to fully share the context. As only text information is accepted, we can send HTML of the currently tested page. GPT doesn't know what elements are hidden, or what elements are visible. It can operate only on the HTML provided.

GPT models have limits on information passed, and HTML pages can be huge. And some information may be irrelevant for testing. For instance, if you test a reading application, you won't probably need text contents of a book inside your HTML, as they won't be used in locators. That's why CodeceptJS send HTML with **all non-interactive HTML elements removed**. So, only links, buttons, fields, and all elements that are set as a link, button, etc will be used by GPT for analysis. In case you have clickable `<div>` but with no `role="button"` it will be ignored. Also, we minify HTML before sending.

Even though, the HTML is still quite big and may exceed the token limit. So we recommend using **gpt-3.5-turbo-16k** model, as it accepts 16K tokens (approx. 50K of HTML text), which should be enough for most web pages. It is possible to strictly limit the size of HTML to not exceed GPT tokens limit.

> 👨‍💼 **AI features require sending HTML contents** of tested applications to OpenAI servers for analysis. If you use it in enterprise, ensure that your company requirements match [OpenAI complience](https://openai.com/security).


### Getting Started

[Install CodeceptJS 3.5](/installation):

```
npx create-codeceptjs .
```
[Obtain API token](https://platform.openai.com/account/api-keys) from OpenAI. Please check out [their pricing](https://openai.com/pricing) first, as unlike ChatGPT using OpenAI API requires a paid account.

Add `OPENAI_API_KEY` environment variable with a key when running codeceptjs:

```
OPENAI_API_KEY=sk-******** npx codeceptjs run
```

This will enable AI features in CodeceptJS.

> When running on CI set `OPENAI_API_KEY` as a secured environment variable

### Writing Tests with AI Copilot

If AI features are enabled when using [interactive pause](/basics/#debug) with `pause()` command inside tests:

For instance, let's create a test to try ai features via `gt` command:

```
npx codeceptjs gt
```

Name a test and write the code. We will use `Scenario.only` instead of Scenario to execute only this exact test.

```js
Feature('ai');

Scenario.only('test ai features', ({ I }) => {
  I.amOnPage('https://getbootstrap.com/docs/5.1/examples/checkout/')
  pause();
});
```

Now run the test in debug mode:

```
OPENAI_API_KEY=sk-******** npx codeceptjs run --debug
```

When pause mode started you can ask GPT to fill in the fields on this page. Use natural language to describe your request, and provide enough details that AI could operate with it. It is important to include at least a space char in your input, otherwise, CodeceptJS will consider the input to be JavaScript code.


```
 I.fill checkout form with valid values without submitting it
```

![](/images/ai_form1.png)

GPT will generate code and data and CodeceptJS will try to execute its code. If it succeeds, the code will be saved to history and you will be able to copy it to your test.

![](/images/ai_form2.png)

This AI copilot works best with long static forms. In the case of complex and dynamic single-page applications, it may not perform as well, as the form may not be present on HTML page yet. For instance, interacting with calendars or inputs with real-time validations (like credit cards) can not yet be performed by AI.

Please keep in mind that GPT can't react to page changes and operates with static text only. This is why it is not ready yet to write the test completely. However, if you are new to CodeceptJS and automated testing AI copilot may help you write tests more efficiently. 

> 👶 Eable AI copilot for junior test automation engineers. It may help them to get started with CodeceptJS and to write good semantic locators.

### Self-Healing Tests

In large test suites, the cost of maintaining tests goes exponentially. That's why any effort that can improve the stability of tests pays itself. In CodeceptJS 3.5 we introduced a new [heal plugin](/plugins#heal) that will use AI to automatically fix a failing test.

Heal plugin can solve exactly one problem: if a locator of an element has changed, and an action can't be performed, **it matches a new locator, tries a command again, and continues executing a test**. For instance, if the "Sign in" button was renamed to "Login" or changed its class, it will detect a new locator of the button and will retry execution.

Heal actions **work only on actions like `click`, `fillField`**, etc, and won't work on assertions, waiters, grabbers, etc. Assertions can't be guessed by AI, the same way as grabbers, as this may lead to unpredictable results.

If Heal plugin successfully fixes the step, it will print a suggested change at the end of execution. Take it as actionable advice and use it to update the codebase. Heal plugin is supposed to be used on CI, and works automatically without human assistance.

To start, enable `heal` plugin in `codecept.conf.js`` or `codecept.conf.ts`:

```js
plugins: {
  heal: {
    enabled: true
  }
}
```

and run tests in AI mode with `OPENAI_API_KEY` provided:

```
OPENAI_API_KEY=sk-******** npx codeceptjs run
```

![](/images/heal.png)


### Arbitrary GPT Prompts

What if you want to take ChatGPT on the journey of test automation and ask it questions while browsing pages?

This is possible with the new `OpenAI` helper. Enable it in your config and it will automatically attach to Playwright, WebDriver, or another web helper you use. It includes the following methods:

* `askGptOnPage` - sends GPT prompt attaching the HTML of the page. Large pages will be split into chunks, according to `chunkSize` config. You will receive responses for all chunks.
* `askGptOnPageFragment` - sends GPT prompt attaching the HTML of the specific element. This method is recommended over `askGptOnPage` as you can reduce the amount of data to be processed.
* `askGptGeneralPrompt` - sends GPT prompt without HTML.

OpenAI helper won't remove non-interactive elements, so it is recommended to manually control the size of the sent HTML.

Here are some good use cases for this helper:

* get page summaries
* inside pause mode navigate through your application and ask to document pages
* etc...

```js
// use it inside test or inside interactive pause
// pretend you are technical writer asking for documentation
const pageDoc = await I.askGptOnPageFragment('Act as technical writer, describe what is this page for', '#container');
```

As of now, those use cases are not really applicable to test automation but maybe you can apply them to your testing setup. 

## Configuration

AI features can be configured inside `codecept.conf` file under `ai` section:

```js
ai: {
  model: 'gpt-3.5-turbo-16k',
  temperature: 0.1,
  html: // {}
}
```

Available options are:

* `model` - [OpenAI model](https://platform.openai.com/docs/models), `gpt-3.5-turbo-16k` is recommended. You may switch to another GPT model, however, consider the speed of processing and size of the input. Models with less than 16K tokens won't be able to process complete HTML even reduced to interactive elements.
* `temperature` - [temperature](https://platform.openai.com/docs/api-reference/chat/create#chat/create-temperature) is a measure of randomness. Use the lowest value possible for test automation purposes.
* `html` - configures how HTML is processed before sending it to GPT. This section is highly important to tune to adapt to your application. For instance, the default strategy may remove some important elements, or contrary keep some elements that have no practical usage in test automation.

Here is the default config:

```js
ai: {
  html: {
    maxLength: 50000,
    simplify: true,
    minify: true,
    interactiveElements: ['a', 'input', 'button', 'select', 'textarea', 'option'],
    textElements: ['label', 'h1', 'h2'],
    allowedAttrs: ['id', 'for', 'class', 'name', 'type', 'value', 'tabindex', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'],
    allowedRoles: ['button', 'checkbox', 'search', 'textbox', 'tab'],
  }
}
```

* `maxLength`: the size of HTML to cut to not reach the token limit. 50K is the current default but you may try to increase it or even set it to null.
* `simplify`: should we process HTML before sending to GPT. This will remove all non-interactive elements from HTML.
* `minify`: shold HTML be additionally minified. This removed empty attributes, shortens notations, etc.
* `interactiveElements`: explicit list of all elements that are considered interactive.
* `textElements`: elements that contain text which can be used for test automation.
* `allowedAttrs`: explicit list of attributes that may be used to construct locators. If you use special `data-` attributes to enable locators, add them to the list.
* `allowedRoles`: list of roles that make standard elements interactive.

It is recommended to try HTML processing on one of your web pages before launching AI features of CodeceptJS.


To do that open the common page of your application and using DevTools copy the outerHTML of `<html>` element. Don't use `Page Source` for that, as it may not include dynamically added HTML elements. Save this HTML into a file and create a NodeJS script:

```js
const { removeNonInteractiveElements } = require('codeceptjs/lib/html');
const fs = require('fs');

const htmlOpts = {
  interactiveElements: ['a', 'input', 'button', 'select', 'textarea', 'label', 'option'],
  allowedAttrs: ['id', 'for', 'class', 'name', 'type', 'value', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'],
  textElements: ['label', 'h1', 'h2'],
  allowedRoles: ['button', 'checkbox', 'search', 'textbox', 'tab'],
};

html = fs.readFileSync('saved.html', 'utf8');
const result = removeNonInteractiveElements(html, htmlOpts);

console.log(result);
```

Tune the options until you are satisfied with the results and use this as `html` config for `ai` section inside `codecept.conf` file.
It is also recommended to check the source of [removeNonInteractiveElements](https://github.com/codeceptjs/CodeceptJS/blob/3.x/lib/html.js) and if needed propose improvements to it.

For instance, if you use `data-qa` attributes to specify locators and you want to include them in HTML, use the following config:

```js
{
  // inside codecept.conf.js
  ai: {
    html: {
      allowedAttrs: [
        'data-qa', 'id', 'for', 'class', 'name', 'type', 'value', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'
      ]
    }
  }
}
```

## Debugging

To debug AI features run tests with `DEBUG="codeceptjs:ai"` flag. This will print all prompts and responses from OpenAI

```
DEBUG="codeceptjs:ai" OPENAI_API_KEY=sk-******** npx codeceptjs run
```