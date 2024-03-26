# Self-Healing Tests

Browser and Mobile tests can fail for vareity of reasons. However, on a big projects there are about 5-10 causes of flaky tests. The more you work and understand your end-to-end tests the more you learn patterns of failure. And after the research you understand how a test could have been fixed: to reload a page, to click that button once again, restart API request. If by looking into a failure you understand what, as a user, you would do to fix that error, then maybe you could teach your tests to heal themselves.

## What is Healing

**Healing defines the way how a test reacts to failure**. You can define multiple healing recipes that could take all needed information: error message, failed test, step, page URL, HTML, etc. A healing recipe can perform some action to fix the failing test on the fly and continue its execution.

![](/img/healing.png)

Let's start with an example the most basic healing recipe. If after a click test has failed, try to reload page, and continue.

```js
heal.addRecipe('reload', {
  priority: 10,
  steps: ['click'],
  fn: async () => {
    return ({ I }) => {
      I.refreshPage();
    };
  },
});
```

Sure, this won't always work and probably won't be useful on every project. But let's follow the idea: if a click has failed, probably the button is not on a page, maybe it is an issue of rendering, maybe some other element overlapped our button, so if we try to reload page we can continue test execution. At least, this is what manual QA would do if they will run the following test in a browser. They will try to reload a page before reporting "it has failed".

So if it is a long end-2-end test that implements user journey, it is more valuable to continue its execution when possible, then fixing a minor issues like overlapping elements. Healing like this can improve the stability of a test.

The example above is only one way a test can be healed. But you can define as many heal recipes as you like. What heal recipe would be effective in your case is depends on a system you test, so **there are no pre-defined heal recipes**. 

## Healing Patterns

There are some ideas where healing can be useful to you:

* **Networking**. If a test depends on a remote resource, and fails because this resource is not available, you may try to send API request to restore that resource before throwing an error.
* **Data Consistency**. A test may fail because you noticed the data glitch in a system. Instead of failing a test you may try to clean up the data and try again to proceed.
* **UI Change**. If there is a planned UI migration of a component, for instance Button was changed to Dropdown. You can prepare test so if it fails clicking Button it can try to do so with Dropdown.
* **Do it again**. If you know, that going one step back and trying to do same actions may solve the issue, you can do so from healers. For instance, a modal didn't render correctly, so you can close it and try to click to open it again.

## Healing vs Retries

Unlike retries heal recipes has following benefits:

* Heal recipes are **declarative**, they are not added directly into into the test code. This keeps test clean and scenario-focused,
* Retry can only re-run failed step(s), but heal recipe can **perform wide set of actions**
* Heal recipe **can react to any step of any test**. So if you catch a common error and you can heal it, you won't need to guess where it can be thrown.

## How to Start Healing

To enable healing, you need to define healing recipes and enable heal plugin.

Create basic healing recipes using this command:

```
npx codeceptjs geenrate:heal
```

or

```
npx codeceptjs gr
```

this will generate `recipes.js` (or `recipes.ts`) in the root directory. Provided default recipe include [AI healing](#ai-healing) and `clickAndType` recipe that replaces `fillField` with `click`+`type`. Use them as examples to write your own heal recipes that will fit for application you are testing.

Require `recipes` file and add `heal` plugin to `codecept.conf` file:

```js

require('./heal')

exports.config = {
  // ...
  plugins: {
    heal: {
      enabled: true
    }
  }
}
```

> Please note that, healing has no sense while developing tests, so it won't work in `--debug` mode. 

## Writing Recipes

Custom heal recipes can be added by running `heal.addRecipe()` function. By default it should be added to `recipes.js` (or `recipes.ts`) file. 

Let's see what recipe consist of:

```js
heal.addRecipe('reloadPageOnUserAccount', {
  // recipe priority
  // which recipe should be tried first 
  priority: 10,

  // an array of steps which may cause the error
  // after which a recipe should be activate
  steps: [
    'click',
  ],

  // if you need some additional information like URL of a page,
  // or its HTML, you can add this context to healing function by 
  // defining `prepare` list of variable
  prepare: {
    url: ({ I }) => I.grabCurrentUrl(),
    html: ({ I }) => I.grabHTMLFrom('body'),
    // don't add variables that you won't use inside the recipe
  },

  // probably we want to execute recipes only on some tests
  // so you can set a string or regex which will check if a test title matches the name
  // in this case we execute recipe only on tests that have "@flaky" in their name
  grep: '@flaky',

  // function to launch to heal the 
  fn: async ({ 
    // standard context variables
    step, test, error, prevSteps,

    // variables coming from prepare function
    html, url,
    
    }) => {
    const stepArgs = step.args;

    // at this point we can decide, should we provide a healing recipe or not
    // for instance, if URL is not the one we can heal at, we should not provide any recipes
    if (!url.includes('/user/acccount')) return;
  
    // otherwise we return a function that will be executed
    return ({ I }) => {
      // this is a very basic example action
      // probably you should do something more sophisticated
      // to heal the test
      I.reloadPage();
      I.wait(1); 
    };
  },
});
```

Let's briefly sum up the properties of a recipe:

* `grep` - selects tests by their name to apply heal to
* `steps` - defines on which steps a recipe should react
* `priority` - sets the order of recipes being applied
* `prepare` - declare variables from a context, which can be used for healing
* `fn` - a function to be applied for healing. It takes all context params: `test`, `step`, `error`, `prevSteps` and returns return either a function or a markdown text with recipes (used by AI healers). If no recipes match the context should not return anything;


## AI Healing

AI can be used to heal failed tests. Large Language Models can analyze HTML of a failed test and provide a suggestion what actions should be performed instead. This can be helpful when running tests on CI as AI can make basic decisions to stabilize failing tests. 

> Use **OpenAI, Azure OpenAI, Claude**, or any of other LLM that can take a prompt, analyze request and provide valid JS code which can be executed by CodeceptJS as a healing suggestion.

AI healing recipe is created within `recipes.js` file:

```js
heal.addRecipe('ai', {
  priority: 10,
  prepare: {
    html: ({ I }) => I.grabHTMLFrom('body'),
  },
  steps: [
    'click',
    'fillField',
    'appendField',
    'selectOption',
    'attachFile',
    'checkOption',
    'uncheckOption',
    'doubleClick',
  ],
  fn: async (args) => {
    return ai.healFailedStep(args);
  },
});
```

As you usee, it will be activated on failed steps and will use HTML of a page as additional information. The prompt, error, and the HTML will be sent to AI provider you configured. 

Learn more how you can [configure AI provider](./ai).

To activate the AI healer don't forget to run tests with `--ai` flag.
