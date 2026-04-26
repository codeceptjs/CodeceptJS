---
permalink: /aitrace
title: AI Trace Plugin
---

# AI Trace Plugin

AI Trace Plugin generates AI-friendly trace files for debugging with AI agents like Claude Code.

When a test fails, you need to understand what went wrong: what the page looked like, what elements were present, what errors occurred, and what led to the failure. This plugin automatically captures all that information and organizes it in a format optimized for AI analysis.

## Quick Start

Enable the plugin in your `codecept.conf.js`:

```javascript
export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    Playwright: {
      url: 'https://example.com',
      // Optional: Enable HAR/trace for HTTP capture
      recordHar: {
        mode: 'minimal',
        content: 'embed',
      },
      trace: 'on',
      keepTraceForPassedTests: true,
    },
  },
  plugins: {
    aiTrace: {
      enabled: true,
    },
  },
}
```

Run tests:

```bash
npx codeceptjs run
```

After test execution, trace files are created in `output/trace_*/trace.md`.

## Artifacts Created

For each test, a `trace_<sha256>` directory is created with the following files:

**trace.md** - AI-friendly markdown file with test execution history

**0000_step_name_screenshot.png** - Screenshot for each step (file names include step names)

**0000_step_name_page.html** - Full HTML of the page at each step. Processed through a `minify -> clean -> beautify` pipeline so the file is multi-line indented, free of `<script>` / `<style>` / `<noscript>` content, free of inline `style=""` attributes, and free of trash class names (Tailwind utilities, framework-generated `v-*` / `ember-*`, hashed classes, scoped `xl:hidden`-style classes). Semantic attributes (`id`, `aria-*`, `data-*`, `role`, etc.) are preserved.

**0000_step_name_aria.txt** - ARIA accessibility snapshot (AI-readable structure without HTML noise; Playwright only)

**0000_step_name_console.json** - Browser console logs, normalized to plain `{ type, text }` objects (Playwright `ConsoleMessage` instances are coerced via their `.type()` / `.text()` methods so the JSON file is genuinely useful — not full of empty objects).

When HAR or trace recording is enabled in your helper config, links to those files are also included.

**Note:** Artifact files are named using step names for easier identification (e.g., `0000_I_see_Product_screenshot.png` instead of just `0000_screenshot.png`).

**Storage state:** Cookies and `localStorage` are intentionally **not** captured per-step by `aiTrace` (they rarely change between actions, so per-step `_storage.json` files would be noise). Use the `pageInfo` plugin or the MCP `snapshot()` tool when you need a storage snapshot.

## Trace File Format

The `trace.md` file contains a structured execution log with links to all artifacts:

```markdown
file: /path/to/test.js
name: My test scenario
time: 3.45s
---

I am on page "https://example.com"
  > navigated to https://example.com/
  > [HTML](./0000_I_am_on_page_https_example.com_page.html)
  > [ARIA Snapshot](./0000_I_am_on_page_https_example.com_aria.txt)
  > [Screenshot](./0000_I_am_on_page_https_example.com_screenshot.png)
  > [Browser Logs](./0000_I_am_on_page_https_example.com_console.json) (7 entries)
  > HTTP: see [HAR file](../har/...) for network requests

I see "Welcome"
  > navigated to https://example.com/
  > [HTML](./0001_I_see_Welcome_page.html)
  > [ARIA Snapshot](./0001_I_see_Welcome_aria.txt)
  > [Screenshot](./0001_I_see_Welcome_screenshot.png)
  > [Browser Logs](./0001_I_see_Welcome_console.json) (0 entries)
```

Files are named with step descriptions for easier navigation and debugging.

## Configuration

### Basic Configuration

```javascript
plugins: {
  aiTrace: {
    enabled: true,
  }
}
```

### Advanced Configuration

```javascript
plugins: {
  aiTrace: {
    enabled: true,

    // Artifact capture options
    captureHTML: true,          // Save HTML for each step
    captureARIA: true,          // Save ARIA snapshots
    captureBrowserLogs: true,   // Save console logs
    captureHTTP: true,          // Links to HAR/trace files
    captureDebugOutput: true,   // CodeceptJS debug messages

    // Screenshot options
    fullPageScreenshots: false, // Full page or viewport only

    // Output options
    output: './output',         // Where to save traces
    deleteSuccessful: false,    // Delete traces for passed tests

    // Step filtering
    ignoreSteps: [
      /^grab/,                  // Ignore all grab* steps
      /^wait/,                  // Ignore all wait* steps
    ],
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable the plugin |
| `captureHTML` | boolean | `true` | Capture HTML for each step |
| `captureARIA` | boolean | `true` | Capture ARIA snapshots |
| `captureBrowserLogs` | boolean | `true` | Capture browser console logs |
| `captureHTTP` | boolean | `true` | Capture HTTP requests (requires HAR/trace) |
| `captureDebugOutput` | boolean | `true` | Capture CodeceptJS debug output |
| `fullPageScreenshots` | boolean | `false` | Use full page screenshots |
| `output` | string | `'./output'` | Directory for trace files |
| `deleteSuccessful` | boolean | `false` | Delete traces for passed tests |
| `ignoreSteps` | array | `[]` | Steps to ignore (regex patterns) |

## Best Practices

### Optimize for Failing Tests

Save disk space by only keeping traces for failed tests:

```javascript
plugins: {
  aiTrace: {
    enabled: true,
    deleteSuccessful: true,  // Only keep failing tests
  }
}
```

### Ignore Noise

Don't capture logs for `grab` and `wait` steps:

```javascript
plugins: {
  aiTrace: {
    enabled: true,
    ignoreSteps: [/^grab/, /^wait/],
  }
}
```

### Selective Artifact Capture

Capture only what you need to reduce file sizes:

```javascript
plugins: {
  aiTrace: {
    enabled: true,
    captureHTML: false,        // Skip HTML (saves ~500KB per step)
    captureARIA: true,         // Keep ARIA (only ~16KB)
    captureBrowserLogs: false, // Skip console logs
  }
}
```

### Enable HTTP Capture

For network debugging, enable HAR/trace in your helper:

```javascript
helpers: {
  Playwright: {
    recordHar: {
      mode: 'minimal',
      content: 'embed',
    },
    trace: 'on',
    keepTraceForPassedTests: true,
  },
  plugins: {
    aiTrace: {
      enabled: true,
      captureHTTP: true,  // Links to HAR/trace files
    },
  },
}
```

## Using with AI Agents

The trace format is optimized for AI agents like Claude Code. When debugging a failing test, just point the AI agent to the `trace.md` file - it will read the file and all linked artifacts automatically to analyze the failure.

## Troubleshooting

### No trace files created

**Possible causes:**
1. Plugin not enabled
2. No steps executed
3. Tests skipped

**Solution:**
```bash
# Check if plugin is enabled
grep -A 5 "aiTrace" codecept.conf.js

# Run with verbose output
npx codeceptjs run --verbose
```

### ARIA snapshots missing

**Possible cause:** Helper doesn't support `grabAriaSnapshot`

**Solution:** Use Playwright or update to latest CodeceptJS

### HAR files missing

**Possible cause:** HAR/trace not enabled in helper config

**Solution:**
```javascript
helpers: {
  Playwright: {
    recordHar: { mode: 'minimal' },
    trace: 'on',
  },
}
```

## Related

- [AI Features](/ai) - AI-powered testing features
- [Plugins](/plugins) - All available plugins
- [Configuration](/configuration) - General configuration
- [Playwright Helper](/playwright) - Playwright-specific configuration
