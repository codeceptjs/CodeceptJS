---
permalink: /debugging
title: Debugging Tests
---

# Debugging Tests

CodeceptJS provides powerful tools for debugging your tests at every level: from verbose output to interactive breakpoints with step-by-step execution.

## Output Verbosity

When something goes wrong, start by increasing the output level:

```bash
npx codeceptjs run --steps     # print each step
npx codeceptjs run --debug     # print steps + debug info
npx codeceptjs run --verbose   # print everything
```

| Flag | What you see |
|------|-------------|
| `--steps` | Each executed step (`I click`, `I see`, etc.) |
| `--debug` | Steps + helper/plugin info, URLs, loaded config |
| `--verbose` | Everything above + internal promise queue, retries, timeouts |

We recommend **always using `--debug`** when developing tests.

For full internal logs, use the `DEBUG` environment variable:

```bash
DEBUG=codeceptjs:* npx codeceptjs run
```

You can narrow it down to specific modules:

```bash
DEBUG=codeceptjs:recorder npx codeceptjs run    # promise chain only
DEBUG=codeceptjs:pause npx codeceptjs run       # pause session only
```

## Interactive Pause

The most powerful debugging tool in CodeceptJS is **interactive pause**. It stops test execution and opens a live shell where you can run steps directly in the browser.

Add `pause()` anywhere in your test:

```js
Scenario('debug checkout', ({ I }) => {
  I.amOnPage('/products')
  I.click('Add to Cart')
  pause()  // <-- test stops here, shell opens
  I.click('Checkout')
})
```

When the shell opens, you'll see:

```
 Interactive shell started
 Use JavaScript syntax to try steps in action
 - Press ENTER to run the next step
 - Press TAB twice to see all available commands
 - Type exit + Enter to exit the interactive shell
 - Prefix => to run js commands
```

### Available Commands

| Input | What it does |
|-------|-------------|
| `click('Login')` | Runs `I.click('Login')` — the `I.` prefix is added automatically |
| `see('Welcome')` | Runs `I.see('Welcome')` |
| `grabCurrentUrl()` | Runs a grab method and prints the result |
| `=> myVar` | Evaluates JavaScript expression |
| *ENTER* (empty) | Runs the next test step and pauses again |
| `exit` or `resume` | Exits the shell and continues the test |
| *TAB TAB* | Shows all available I.* methods |

You can also pass variables into the shell:

```js
const userData = { name: 'John', email: 'john@test.com' }
pause({ userData })
// in shell: => userData.name
```

### Using Pause as a Stop Point

`pause()` works as a **breakpoint** in your test. Place it before a failing step to inspect the page state:

```js
Scenario('fix login bug', ({ I }) => {
  I.amOnPage('/login')
  I.fillField('Email', 'user@test.com')
  I.fillField('Password', 'secret')
  pause()  // stop here, inspect the form before submitting
  I.click('Sign In')
  I.see('Dashboard')
})
```

You can also add it in hooks:

```js
After(({ I }) => {
  pause()  // pause after every test to inspect final state
})
```

### Pause Modes

`pause()` adapts to who's driving the test:

- **TTY (humans)** — when `process.stdin` is a terminal (running `npx codeceptjs run --debug` yourself), the readline REPL described above opens.
- **MCP server (agent-driven debug)** — the MCP server registers an in-process pause handler before running tests, so when `pause()` fires inside a `run_test` invocation, control yields back to the agent. The agent drives the REPL through the [`pause` MCP tool](/mcp#pause). The same `I` container the test uses runs the agent's code, so artifacts (URL, ARIA, HTML, screenshot, console, storage) are captured against the live page.

## Pause Plugin

For automated debugging without modifying test code, use the `pause` plugin. It pauses tests based on different triggers, controlled entirely from the command line. The default is `on=fail`.

### Pause on Failure

Automatically enters interactive pause when a step fails:

```bash
npx codeceptjs run -p pause
# or, explicit:
npx codeceptjs run -p pause:on=fail
```

This is the most common debug workflow — run your tests, and when one fails, you land in the interactive shell with the browser in the exact state of the failure. You can inspect elements, try different selectors, and figure out what went wrong.

> The legacy `pauseOnFail` plugin still works as a deprecated alias.

### Pause on Every Step

Enters interactive pause at the start of the test. Use *ENTER* to advance step by step:

```bash
npx codeceptjs run -p pause:on=step
```

This gives you full step-by-step execution. After each step, you're back in the interactive shell where you can inspect the page before pressing ENTER to continue.

### Pause on File (Breakpoint)

Pauses when execution reaches a specific file:

```bash
npx codeceptjs run -p pause:on=file:path=tests/login_test.js
```

With a specific line number:

```bash
npx codeceptjs run -p pause:on=file:path=tests/login_test.js;line=43
```

This works like a breakpoint — the test runs normally until it hits a step defined at that file and line, then opens the interactive shell.

### Pause on URL

Pauses when the browser navigates to a matching URL:

```bash
npx codeceptjs run -p pause:on=url:pattern=/users/1
```

Supports `*` wildcards:

```bash
npx codeceptjs run -p pause:on=url:pattern=/api/*/edit
npx codeceptjs run -p pause:on=url:pattern=/checkout/*
```

This is useful when you want to inspect a specific page regardless of which test step navigates there.

## Browser Control

For ad-hoc overrides of browser helper config without editing `codecept.conf`, use the `browser` plugin via `-p`. Works for Playwright, Puppeteer, WebDriver and Appium in one call.

Force a visible browser:

```bash
npx codeceptjs run -p browser:show
```

Force headless (also injects `--headless` into WebDriver chrome/firefox capability args):

```bash
npx codeceptjs run -p browser:hide
```

Switch the browser engine for Playwright / Puppeteer / WebDriver / TestCafe in one shot — no per-helper config gymnastics:

```bash
npx codeceptjs run -p browser:browser=firefox
npx codeceptjs run -p browser:browser=webkit:hide
```

Pass any other helper config as `key=value`. Values are coerced (`true`/`false` → boolean, digits → Number, otherwise string). Tokens are colon-chained on a single `-p`:

```bash
npx codeceptjs run -p browser:windowSize=1024x768:video=false
npx codeceptjs run -p browser:hide:video=true
```

`browser=<name>` routes through `setBrowser` (so Puppeteer correctly receives `product`, Playwright receives `browser`, etc.); `windowSize=WxH` routes through `setWindowSize` (which also injects `--window-size=W,H` into chromium/chrome args). Anything else is shallow-merged onto every browser helper present in config.

## IDE Debugging

### VS Code

You can use the built-in Node.js debugger in VS Code to set breakpoints in test files.

Add this configuration to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "codeceptjs",
  "args": ["run", "--grep", "@your_test_tag", "--debug"],
  "program": "${workspaceFolder}/node_modules/codeceptjs/bin/codecept.js"
}
```

Set breakpoints in your test files, then press F5 to start debugging. You'll be able to step through code, inspect variables, and use the VS Code debug console — all while the browser is open and controlled by the test.

Combine with `pause()` for the best experience: set a VS Code breakpoint to inspect JavaScript state, then add `pause()` to interact with the browser.

### WebStorm

```bash
node $NODE_DEBUG_OPTION ./node_modules/.bin/codeceptjs run
```

### Node.js Inspector

```bash
node --inspect ./node_modules/.bin/codeceptjs run
node --inspect-brk ./node_modules/.bin/codeceptjs run  # break on first line
```

## Debugging on Failure

Several built-in plugins capture information when tests fail. These are most useful on CI where you can't use interactive debugging.

### Screenshots on Failure

Enabled by default. Saves a screenshot when a test fails:

```js
plugins: {
  screenshot: {
    enabled: true,
    on: 'fail',
    uniqueScreenshotNames: true,
    fullPageScreenshots: true,
  }
}
```

Screenshots are saved in the `output` directory. The same plugin also supports `on=test`, `on=step`, `on=file`, and `on=url` to capture screenshots in other situations.

### Page Info on Failure

Captures URL, HTML errors, and browser console logs on failure:

```js
plugins: {
  pageInfo: {
    enabled: true,
  }
}
```

### Step-by-Step Report

Generates a slideshow of screenshots taken after every step — a visual replay of what the test did. Set `slides: true` on the `screenshot` plugin (with `on=step`):

```js
plugins: {
  screenshot: {
    enabled: true,
    on: 'step',
    slides: true,
    deleteSuccessful: true,   // keep only failed tests
    fullPageScreenshots: true,
  }
}
```

```bash
npx codeceptjs run -p screenshot:on=step;slides=true
```

After the run, open `output/records.html` to browse through the slideshows.

## AI-Powered Debugging

### AI in Interactive Pause

When AI is configured, the interactive pause shell accepts natural language commands:

```
 AI is enabled! (experimental) Write what you want and make AI run it

I.$ fill the login form with test credentials and submit
```

AI reads the current page HTML and generates CodeceptJS steps. See [Testing with AI](/ai) for setup.

### AI Trace Plugin

The `aiTrace` plugin captures rich execution traces for AI analysis — screenshots, HTML snapshots, ARIA trees, browser logs, and network requests at every step:

```js
plugins: {
  aiTrace: {
    enabled: true,
  }
}
```

After a test run, trace files are generated in `output/trace_*/trace.md`. Feed these to an AI assistant (like Claude Code) for automated failure analysis. See [AI Trace Plugin](/aitrace) for details.

### MCP Server

CodeceptJS includes an [MCP server](/mcp) that allows AI agents to control tests programmatically — list tests, run them step by step, capture artifacts, and analyze results. This enables AI-driven debugging workflows where an agent can investigate failures autonomously.

> AI agent integration and MCP server will be covered in detail on a dedicated page.
