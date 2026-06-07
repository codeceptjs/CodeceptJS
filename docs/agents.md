---
permalink: /agents
title: Agentic Testing
---

# Agentic Testing

## What Makes CodeceptJS Agent-friendly

CodeceptJS 4 is designed for agent testing. It ships with its own MCP and official skills that teach agents best practices in test automation—how to write tests, choose locators, test them live in the browser, and refactor to page objects.

Agents get full control over test and browser execution: 

- **Full HTML access and ARIA snapshots.** Agents see buttons with icons, empty labels, and other elements Playwright MCP's accessibility tree omits.

- **Query HTML directly with CSS, ARIA, Semantic Locators or XPath** Agents can freely run XPath or CSS to efficiently search over HTML.

- **Browser logs and page state as files.** Agents read via native filesystem tools instead of extra requests, eliminating redundant context dumps.

- **Same locators for tests and agents.** Tests and agent scripts share identical selectors. No elements by reference indexes, no clicks by coordinates. Agents inherit battle-tested patterns without guessing.

- **Testing-first framework, not browser control.** CodeceptJS is built for testing, so agents stay focused on test scenarios instead of raw browser commands.

CodeceptJS is token-efficient: it stores HTML, ARIA, logs, and HTTP request data as files instead of streaming them through MCP. Agents read these files with their native shell tools—no extra API calls, no redundant context.

## Essential Setup

Two things make agent testing work: the **skills** that teach the agent CodeceptJS, and the **MCP server** that lets it drive the browser. Set both up once, from your project directory.

Install the skills:

```bash
npx skills add codeceptjs/skills
```

Connect the MCP server (`npx codeceptjs-mcp`).

**Claude Code:**

```bash
claude mcp add codeceptjs -- npx codeceptjs-mcp
```

**Codex:**

```bash
codex mcp add codeceptjs -- npx codeceptjs-mcp
```

**Cursor** — add to `.cursor/mcp.json`:

```json
{ "mcpServers": { "codeceptjs": { "command": "npx", "args": ["codeceptjs-mcp"] } } }
```

See [/mcp](/mcp) for full client setup. Now the agent is ready to run the loop.

## The loop

Whether the agent is writing a new test or fixing an old one, it follows the same cycle.

1. **Open the page.** Run a stub test (new work) or set a breakpoint at the failing step (fix). The browser lands at the right starting point and yields control to the agent.
2. **Read the page.** MCP saves HTML, ARIA, and screenshot of the page to files (and the agent can call the `snapshot` tool to refresh them). The agent reads those files before deciding what to try next, controlling its token usage.
3. **Run a CodeceptJS command.** The agent tries `I.*` commands like `I.click('Add to cart')`, `I.fillField('Email', secret(process.env.EMAIL))`, `I.see('Confirmed')`. On success, that line goes into the test — same syntax.
4. **Check the result.** The response after each command shows the new page state. If the URL changed and the modal opened, the line goes into the verified sequence. If not, the agent reads the page again and tries a different locator or a wait.
5. **Move forward.** The agent looks at the new state and chooses the next command. Steps 2–4 repeat until the scenario is whole.
6. **Commit to the file.** The agent edits the test — replaces `pause()` (new tests) or the broken line (fixes) with the verified sequence — then reruns end-to-end and reads the trace to confirm.


## How It Works

CodeceptJS ships an **MCP server and a skillset** that lets an AI agent (Claude Code, Cursor, Codex, others) write and fix tests by driving the real browser. The agent runs the same `I.*` commands the test does, reads how the page responds, and only commits the lines that succeeded.

## Why MCP

The traditional agent testing loop is test/fix/retry, where the agent executes a test, watches it fail, reads artifacts, performs code fixes, and reruns the test. The agent applies fixes by intelligent guess — looking at the ARIA tree, HTML, and screenshot — then assumes the fix is enough and reruns the test hoping it will pass. If the guess is wrong and the test runs for over a minute, it may take dozens of minutes of iteration and a lot of wasted tokens.

To improve that flow, the agent can spawn a browser and open the page the way the test does. This lets it interact with the page more freely and perform multi-step actions. But putting that experience back into test code is not efficient either: actions executed in the browser may not be relevant in test context, so the agent ends up in another guess-and-try loop.

The problem is that **the test runs in a different context than the agent**.

The agent can launch a test but can't control it while it's running. It can't access the browser. It can't set a breakpoint.

This is where CodeceptJS MCP steps in. Connected to the agent, it can:

- run a test and pause it on failure
- interact with the browser in a test context
- test locators and perform actions live while the test is running
- write successful actions to the test file

This lets the agent get a test working in one iteration. The agent can live-write the test before your eyes by exploring the page and performing actions that eventually land in the CodeceptJS test file.

**Live debugging of tests** is what CodeceptJS MCP provides. The agent receives feedback faster — not from a whole test execution but from specific actions on a specific page — so it can adjust and react faster, trying different approaches.

The MCP server is the agent-facing equivalent of the `pause()` REPL — same access, driven by tool calls instead of keystrokes. Full tool reference at [/mcp](/mcp).


## How the agent reads the page

MCP commands are token efficient — they don't stream large HTML pages back to the model. MCP writes artifacts to disk under `output/trace_*/` and returns file paths. The agent reads each artifact with its own bash tools — `cat`, `grep`, `jq`.

A `run_code` response, for example, looks like this:

```json
{
  "status": "success",
  "artifacts": {
    "url": "http://localhost:8000/",
    "html": "file:///output/trace_run_code_.../mcp_page.html",
    "aria": "file:///output/trace_run_code_.../mcp_aria.txt",
    "screenshot": "file:///output/trace_run_code_.../mcp_screenshot.png",
    "console": "file:///output/trace_run_code_.../mcp_console.json",
    "storage": "file:///output/trace_run_code_.../mcp_storage.json"
  }
}
```

Only `url` is inline. The rest are paths the agent opens with the right tool:

| Artifact | How the agent reads it |
|----------|------------------------|
| `*_screenshot.png` | As an image — most agents are multimodal |
| `*_aria.txt` | Whole — small and structured |
| `*_page.html` | With `grep` — too large for context, searchable for specific elements/attributes |
| `*_console.json` | With `jq` — filter for errors, 4xx/5xx, deprecation warnings |
| `*_storage.json` | Whole — cookies and `localStorage` snapshot |
| `trace.md` | Whole — markdown index linking every step to its artifacts |

Saved HTML is formatted, with non-semantic elements stripped out: `<style>`, `<script>`, Tailwind-style trash classes, and inline `style=""` attributes. `grep` can then effectively find the correct tree branch in raw page source. ARIA snapshots are smaller and more structured than HTML, which is why the agent prefers them when picking locators.

## Usage Examples

When MCP and skills are connected, the agent receives predefined workflows and can act effectively for testing purposes. Common scenarios it handles:

### Writing a new test

You ask: "Add a test for the checkout flow."

The agent writes a stub:

```javascript
Scenario('checkout', ({ I }) => {
  I.amOnPage('/cart')
  pause()
})
```

It runs the stub. The browser opens at `/cart` and yields control at `pause()`. The agent reads the ARIA tree, runs `I.click('Add to cart')`, sees the cart total update — that line goes into the verified sequence. It runs `I.fillField('Email', '...')`, sees the field accept the value, records it. Through `I.click('Continue to payment')`, `I.see('Payment')`, `I.fillField('Card', secret(process.env.TEST_CARD))`, `I.click('Pay')`, `I.see('Order confirmed')` — each command commits only after the response confirms it worked.

When the scenario is whole, the agent edits the test file: replaces `pause()` with the verified sequence, renames the scenario, wraps credentials with `secret()`. It reruns the file end-to-end with `aiTrace` on and hands you the diff.

### Fixing a failing test

A test fails. You point the agent at the scenario.

It opens `output/trace_<TestName>_*/trace.md` from the last run, reads the steps, and finds the one marked failed. Most of the time the screenshot and ARIA from that step explain the cause — "Save" is now "Save changes," or a spinner is gating the next action. The agent patches the line and reruns.

When the trace doesn't say enough, the agent passes a step number to `run_test` so the test pauses right before the failing step. From the live page, it tries `I.click({ role: 'button', name: 'Save changes' })`, sees the modal close. Or `I.waitForInvisible('.spinner', 10)` followed by the original click — watches it pass. Whatever holds goes into the test.

The fix lands with a one-line note explaining what changed.

### Auto-fixing on CI

After a failed run, the agent reads every trace under `output/`, clusters failures by signature, and patches what fits a small set of safe fixes (locator drift, missing waits, raw `I.wait(N)` replacement). It reruns only the failing scenarios, compares against the baseline, and writes a markdown report at `output/ci-fix.md`.

If the fix held, the PR goes green. If it didn't, every edit is rolled back with `git checkout` and the report says which patterns the agent couldn't safely handle. No half-applied fixes left behind, no `retries: 3` masking the problem.

## Skills bundle

Skills teach the agent best practices for using CodeceptJS. Plug them in when you develop tests with agents, and update them regularly to ensure you use CodeceptJS in the most effective way.

| Skill | Use case |
|-------|----------|
| `writing-codeceptjs-tests` | Author or extend a scenario. Runs the loop above with a stub-and-pause flow for greenfield work, incremental `run_code` for known flows. |
| `debugging-codeceptjs-tests` | A test is failing or flaky. Reads the trace, decides whether to patch from the trace alone or set a breakpoint on the live page. |
| `ci-fix-tests` | Conservative auto-repair on CI |
| `refactoring-codeceptjs-tests` | Extract page objects, tame long locators, move raw browser code into helpers. Proposes in batches. |
| `codeceptjs-fundamentals` | Obtain actual CodeceptJS knowledge. |
| `codeceptjs-exploration` | Pick a stable locator from messy markup. |
| `codeceptjs-run-analysis` | Read trace artifacts, cluster CI failures into root causes, verify a fix held across many traces. |
| `codeceptjs-auth` | Authorize efficiently with `auth` plugin. |

## Pointers

- [/mcp](/mcp) — full MCP tool reference, client setup
- [/aitrace](/aitrace) — trace plugin configuration and capture options
- [/debugging](/debugging) — pause modes, IDE setup, the `pause` plugin
- [skills repo](https://github.com/codeceptjs/skills) — source and install for non-Claude clients
