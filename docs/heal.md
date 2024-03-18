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

* Heal recipes are declarative, they are not added directly into into the test code. This keeps test clean and scenario-focused,
* Retry can only re-run failed step(s), but heal recipe can perform arbitrary actions
* Heal recipe can react to any step of any test. So if you catch a common error and you can heal it, you won't need to guess where it can be thrown.











## Create Heal

## Heal Plugin

## AI Healing

