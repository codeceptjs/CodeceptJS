# Debugging

CodeceptJS allows to write and debug tests on the fly while keeping your browser opened.
By using interactive shell you can stop execution at any point and type in CodeceptJS commands.

This is especially useful while writing a new scratch. After opening a page call `pause()` to start interacting with a page:

```js
I.amOnPage('/');
pause();
```

Try to perform your scenario step by step. Then copy succesful commands and insert them into a test.

## Pause

Test execution can be paused in any place of a test with `pause()` call.

This launches interactive console where you can call actions of `I` object.

```
 Interactive shell started
 Press ENTER to resume test
 - Use JavaScript syntax to try steps in action
 - Press TAB twice to see all available commands
 - Enter next to run the next step
 I.click

```

Type in different actions to try them, copy valid successful ones to test, update the test file.

Press `ENTER` to resume test execution.

To **debug test step-by-step** type `next` and press Enter. The next step will be executed and interactive shell will be shown again.

To see all available commands press TAB two times to see list of all actions included in I.

If a test is failing you can prevent browser from closing by putting `pause()` command into `After()` hook. This is very helpful to debug failing tests. This way you can keep the same session and try different actions on a page to get the idea what went wrong.

```js
After(pause);
```

Interactive shell can be started outside the test context by running

```bash
codeceptjs shell
```


## Screenshot on failure

By default CodeceptJS saves a screenshot of a failed test.
This can be configured in [screenshotOnFail Plugin](plugins.md#screenshotonfail)

## Step By Step Report

To see how the test was executed, use [stepByStepReport Plugin](plugins.md#stepbystepreport). It saves a screenshot of each passed step and shows them in a nice slideshow.


## Debug Mode

CodeceptJS provides a debug mode in which additional information is printed.
It can be turned on with `--debug` flag.

```sh
codeceptjs run --debug
```

to receive even more information turn on `--verbose` flag:

```sh
codeceptjs run --verbose
```

And don't forget that you can pause execution and enter **interactive console** mode by calling `pause()` inside your test.

## Attach Debugger

For advanced debugging use NodeJS debugger. In **WebStorm IDE**:

```sh
node $NODE_DEBUG_OPTION ./node_modules/.bin/codeceptjs run
```

For **Visual Studio Code**, add the following configuration in launch.json:

```json
{
  "type": "node",
  "request": "launch",
  "name": "codeceptjs",
  "args": ["run", "--grep", "@your_test_tag"],
  "program": "${workspaceFolder}/node_modules/.bin/codeceptjs"
}
```
This will let you set breakpoints inside your tests.

```js
Scenario('test', (I) => {
  I.amOnPage('/');
  I.click('Login');
  I.see('Please Login', 'h1');
  // ...
});
```

You will be disappointed first time you try. The actor functions in CodeceptJS (like `I.click('Login')`) are asynchronous. They add actions to a promise chain but do not wait for the action to complete. You can step,step,step and nothing happens in the browser.

The easy way to solve this is to add `await` for all actor calls. This forces the test to wait for the promise chain to finish.

```js
Scenario('test', async (I) => {
  await I.amOnPage('/');
  await I.click('Login');
  await I.see('Please Login', 'h1');
  // ...
});
```


---

### Next: [Helpers >>>](helpers.md)

---