# Multiple Sessions

CodeceptJS allows to run several browser sessions inside a test. This can be useful for testing communication between users inside a system, for instance in chats. To open another browser use `session()` function as shown in example:

```js
Scenario('test app', (I) => {
  I.amOnPage('/chat');
  I.fillField('name', 'davert');
  I.click('Sign In');
  I.see('Hello, davert');
  session('john', () => {
    // another session started
    I.amOnPage('/chat');
    I.fillField('name', 'john');
    I.click('Sign In');
    I.see('Hello, john');
  });
  // switching back to default session
  I.fillField('message', 'Hi, john');
  // there is a message from current user
  I.see('me: Hi, john', '.messages');
  session('john', () => {
    // let's check if john received it
    I.see('davert: Hi, john', '.messages');
  });
});
```

`session` function expects a first parameter to be a name of a session. You can switch back to session by using the same name.

You can override config for session by passing second parameter:

```js
session('john', { browser: 'firefox' } , () => {
  // run this steps in firefox
  I.amOnPage('/');
});
```

or just start session without switching to it. Call `session` passing only its name:

```js
Scenario('test', (I) => {
  // opens 3 additional browsers
  session('john');
  session('mary');
  session('jane');

  I.amOnPage('/');

  // switch to session by its name
  session('mary', () => {
    I.amOnPage('/login');
  });
}
```
`session` can return value which can be used in scenario:

```js
// inside async function
const val = await session('john', () => {
  I.amOnPage('/info');
  return I.grabTextFrom({ css: 'h1' });
});
I.fillField('Description', val);
```

Function passed into session can use `I`, page objects, and any objects declared for the scenario.
This function can also be declared as async (but doesn't work as generator).

Also, you can use `within` inside a session but you can't call session from inside `within`.
