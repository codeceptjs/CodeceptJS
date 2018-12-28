# Retries

## Retry Step

If you have a step which often fails you can retry execution for this single step.
Use `retry()` function before an action to ask CodeceptJS to retry this step on failure:

```js
I.retry().see('Welcome');
```

If you'd like to retry step more than once pass the amount as parameter:

```js
I.retry(3).see('Welcome');
```

Additional options can be provided to retry so you can set the additional options (defined in [promise-retry](https://www.npmjs.com/package/promise-retry) library).


```js
// retry action 3 times waiting for 0.1 second before next try
I.retry({ retries: 3, minTimeout: 100 }).see('Hello');

// retry action 3 times waiting no more than 3 seconds for last retry
I.retry({ retries: 3, maxTimeout: 3000 }).see('Hello');

// retry 2 times if error with message 'Node not visible' happens
I.retry({
  retries: 2,
  when: err => err.message === 'Node not visible'
}).seeElement('#user');
```

Pass a function to `when` option to retry only when error matches the expected one.

## Auto Retry

You can auto-retry a failed step by enabling [retryFailedStep Plugin](https://codecept.io/plugins/#retryfailedstep).

## Retry Scenario

When you need to rerun scenarios few times just add `retries` option added to `Scenario` declaration.

CodeceptJS implements retries the same way [Mocha does](https://mochajs.org#retry-tests);
You can set number of a retries for a feature:

```js
Scenario('Really complex', (I) => {
  // test goes here
}).retry(2);

// alternative
Scenario('Really complex', { retries: 2 }, (I) => {});
```

This scenario will be restarted two times on a failure.

## Retry Feature

To set this option for all scenarios in a file, add retry to a feature:

```js
Feature('Complex JS Stuff').retry(3);
```

Every Scenario inside this feature will be rerun 3 times.
You can make an exception for a specific scenario by passing `retries` option to a Scenario.
