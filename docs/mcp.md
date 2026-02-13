# CodeceptJS MCP Server

Model Context Protocol (MCP) server for CodeceptJS enables AI agents (like Claude) to interact with and control CodeceptJS tests programmatically.

## Overview

The MCP server provides AI agents with tools to:
- List all tests in a CodeceptJS project
- List all available CodeceptJS actions (I.* methods)
- Run arbitrary CodeceptJS code with artifacts capture
- Run specific tests with detailed output
- Run tests step by step for detailed analysis
- Start and stop browser sessions
- Capture screenshots, ARIA snapshots, HTML, and console logs

## Installation

Install the MCP SDK dependency:

```bash
npm install @modelcontextprotocol/sdk
```

The MCP server binary is available at `bin/mcp-server.js`.

## Configuration

Configure the MCP server in your Claude Desktop or MCP-compatible client configuration:

### Basic Configuration

```json
{
  "mcpServers": {
    "codeceptjs": {
      "command": "node",
      "args": ["path/to/codeceptjs/bin/mcp-server.js"]
    }
  }
}
```

With basic configuration, the server looks for `codecept.conf.js` in the current working directory.

### Configuration with Environment Variables

Use environment variables to specify the CodeceptJS project directory and config file:

```json
{
  "mcpServers": {
    "codeceptjs": {
      "command": "node",
      "args": ["path/to/codeceptjs/bin/mcp-server.js"],
      "env": {
        "CODECEPTJS_CONFIG": "/path/to/your/codecept.conf.js",
        "CODECEPTJS_PROJECT_DIR": "/path/to/your/project"
      }
    }
  }
}
```

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `CODECEPTJS_CONFIG` | Absolute path to the CodeceptJS configuration file |
| `CODECEPTJS_PROJECT_DIR` | Absolute path to the project root directory |

### Example: Full Claude Desktop Configuration

```json
{
  "mcpServers": {
    "codeceptjs-mcp": {
      "command": "node",
      "args": ["D:/projects/my-project/node_modules/codeceptjs/bin/mcp-server.js"],
      "env": {
        "CODECEPTJS_CONFIG": "D:/projects/my-project/codecept.conf.js",
        "CODECEPTJS_PROJECT_DIR": "D:/projects/my-project"
      }
    }
  }
}
```

## Available Tools

### list_tests

List all tests in the CodeceptJS project.

**Parameters:**
- `config` (optional): Path to codecept.conf.js (default: codecept.conf.js)

**Returns:**
```json
{
  "count": 5,
  "tests": [
    {
      "file": "/full/path/to/test/file.js",
      "relativePath": "tests/example_test.js"
    }
  ]
}
```

**Example:**
```json
{
  "name": "list_tests",
  "arguments": {
    "config": "/path/to/codecept.conf.js"
  }
}
```

### list_actions

List all available CodeceptJS actions (I.* methods) from enabled helpers and support objects.

**Parameters:**
- `config` (optional): Path to codecept.conf.js

**Returns:**
```json
{
  "count": 120,
  "actions": [
    {
      "helper": "Playwright",
      "action": "amOnPage",
      "signature": "I.amOnPage(url)"
    },
    {
      "helper": "Playwright",
      "action": "click",
      "signature": "I.click(locator, context)"
    }
  ]
}
```

### run_code

Run arbitrary CodeceptJS code. Returns status, ARIA snapshot, URL, console logs, and HTML.

**Parameters:**
- `code` (required): CodeceptJS code to execute
- `timeout` (optional): Timeout in milliseconds (default: 60000)
- `config` (optional): Path to codecept.conf.js
- `saveArtifacts` (optional): Save artifacts like ARIA, URL, console logs, HTML (default: true)

**Returns:**
```json
{
  "status": "success",
  "output": "Code executed successfully",
  "error": null,
  "artifacts": {
    "aria": "main -> \"Welcome\"...",
    "url": "http://localhost:8000/",
    "consoleLogs": [],
    "html": "<html>...</html>"
  }
}
```

**Example:**
```json
{
  "name": "run_code",
  "arguments": {
    "code": "await I.amOnPage('/'); await I.see('Welcome');",
    "timeout": 30000,
    "saveArtifacts": true
  }
}
```

### run_test

Run a specific test by name or file path. Uses subprocess to run tests with isolation.

**Parameters:**
- `test` (required): Test name or file path
- `timeout` (optional): Timeout in milliseconds (default: 60000)
- `config` (optional): Path to codecept.conf.js

**Returns:**
```json
{
  "meta": {
    "exitCode": 0,
    "cli": "/path/to/codecept.js",
    "root": "/project/root",
    "configPath": "/path/to/codecept.conf.js",
    "args": ["run", "--config", "...", "--reporter", "json", "test_file.js"],
    "resolvedFile": "/full/path/to/test_file.js"
  },
  "reporterJson": {
    "stats": {
      "tests": 3,
      "passes": 2,
      "failures": 1
    }
  },
  "stderr": "",
  "rawStdout": ""
}
```

**Features:**
- Automatically resolves test names to file paths
- Supports partial test name matching
- Uses json reporter for structured output
- Executes in subprocess for isolation
- Includes stderr for debugging

**Example:**
```json
{
  "name": "run_test",
  "arguments": {
    "test": "basic_navigation_test",
    "timeout": 60000
  }
}
```

### run_step_by_step

Run a test step by step with detailed step information including timing and status. Generates AI-friendly trace files.

**Parameters:**
- `test` (required): Test name or file path
- `timeout` (optional): Timeout in milliseconds (default: 60000)
- `config` (optional): Path to codecept.conf.js

**Returns:**
```json
{
  "stepByStep": true,
  "results": [
    {
      "test": "Navigate to homepage",
      "file": "/path/to/test.js",
      "traceFile": "file:///output/trace_Test_Name_abc123/trace.md",
      "status": "completed",
      "steps": [
        {
          "step": "I.amOnPage(\"/\")",
          "status": "passed",
          "time": 150
        },
        {
          "step": "I.seeInTitle(\"Test App\")",
          "status": "passed",
          "time": 50
        }
      ]
    }
  ]
}
```

**Trace Files:**
- Generated in `{output_dir}/trace_{TestName}_{hash}/`
- Includes screenshots (PNG), page HTML, ARIA snapshots, console logs
- `trace.md` file provides structured summary for AI analysis
- Named with test title and hash for uniqueness

**Example:**
```json
{
  "name": "run_step_by_step",
  "arguments": {
    "test": "authentication_test",
    "timeout": 90000
  }
}
```

### start_browser

Start the browser session (initializes CodeceptJS container).

**Parameters:**
- `config` (optional): Path to codecept.conf.js

**Returns:**
```json
{
  "status": "Browser started successfully"
}
```

**Note:** Browser is automatically started on first code execution. This tool is useful for pre-initialization.

### stop_browser

Stop the browser session and cleanup resources.

**Parameters:**
- None

**Returns:**
```json
{
  "status": "Browser stopped successfully"
}
```

**Note:** Useful for releasing resources between long-running sessions.

## Testing

### Run MCP Server Tests

The MCP server includes a comprehensive test suite:

```bash
node test/mcp/mcp_server_test.js
```

Tests cover:
- Tool listing and schema validation
- Test enumeration
- Action listing
- Code execution with artifacts
- Test execution (run_test)
- Step-by-step execution
- Browser lifecycle
- Error handling

### Run Demo Tests with MCP

**Important: Start the test web server first!**

The MCP test scenarios require a web server running on port 8000. Start it in a separate terminal:

```bash
# Option 1: Using http-server (recommended)
cd test/mcp
npx http-server -p 8000

# Option 2: Using Python
cd test/mcp
python -m http.server 8000

# Option 3: Using PHP
cd test/mcp
php -S localhost:8000
```

The server will start at http://127.0.0.1:8000

**Keep this terminal open** while running tests through MCP/Claude.

Once the server is running, you can use Claude to run tests:

```
"List all tests"
"Run basic navigation test"
"Run form interaction test step by step"
```

**Note:** If tests fail with ERR_CONNECTION_REFUSED, make sure the web server is running on port 8000.

## Trace Files for AI Debugging

When using `run_step_by_step`, the server generates trace files that provide rich context for AI agents:

### Trace File Structure

```
output/
└── trace_Test_Name_abc123/
    ├── 0000_screenshot.png     # Screenshot after step 0
    ├── 0000_page.html         # HTML snapshot after step 0
    ├── 0000_aria.txt          # ARIA snapshot after step 0
    ├── 0000_console.json      # Console logs after step 0
    ├── 0001_screenshot.png     # Screenshot after step 1
    ├── 0001_page.html
    ├── 0001_aria.txt
    ├── 0001_console.json
    └── trace.md               # AI-friendly summary
```

### Using Trace Files with AI

The `trace.md` file provides structured information perfect for AI analysis:

```markdown
# Test: Login functionality

**Status**: failed
**File**: tests/login_test.js

## Steps

1. **I.amOnPage("/login")** - passed (150ms)
2. **I.fillField("#username", "user")** - passed (80ms)
3. **I.fillField("#password", "pass")** - passed (75ms)
4. **I.click("#login")** - passed (100ms)
5. **I.see("Welcome")** - failed (50ms)

## Error

Element "Welcome" not found

## Artifacts

- Screenshot: 0005_screenshot.png
- HTML: 0005_page.html
- ARIA: 0005_aria.txt
```

AI agents can use these artifacts to:
- Visualize what the test saw at each step
- Analyze page structure via ARIA
- Debug issues using HTML snapshots
- Identify errors from console logs

## Architecture

### Request Flow

1. MCP Client sends JSON-RPC request via stdin/stdout
2. Server processes request and calls appropriate tool
3. Tool executes CodeceptJS code or runs tests
4. Results formatted as JSON and returned
5. MCP Client receives response

### Session Management

- **Initialization**: CodeceptJS container initialized on first request
- **Browser**: Started once and reused across requests
- **Locking**: `run_test` uses locking to prevent concurrent test runs
- **Cleanup**: `stop_browser` releases all resources

### Error Handling

- All errors returned as JSON with error message and stack
- Invalid tools return error response
- Test failures included in results (not thrown)
- Timeout protection on all long-running operations

## Troubleshooting

### MCP Server Not Starting

- Ensure `@modelcontextprotocol/sdk` is installed
- Check Node.js version (requires Node.js 16+)
- Verify the path to mcp-server.js in your MCP client config
- Check file permissions

### Configuration Not Found

- Set `CODECEPTJS_CONFIG` environment variable to absolute path of your config file
- Set `CODECEPTJS_PROJECT_DIR` environment variable to your project directory
- Use absolute paths in environment variables (e.g., `D:/projects/my-project/codecept.conf.js`)
- Verify config file exists and is valid JavaScript

### Tests Not Found

- Verify you're in the correct working directory
- Check that `codecept.conf.js` exists
- Use absolute paths for tests if relative paths don't work
- Check test patterns in config file match your test files

### Browser Launch Issues

- Ensure browser dependencies are installed (Chromium for Playwright)
- Check if browser is already running
- Verify `show: false` in config (headless mode recommended)
- Check firewall/proxy settings

### Tests Stuck or Timing Out

- Increase timeout parameter (default 60s)
- Check if web server is running (for tests that need it)
- Disable video recording and other heavy features
- Use `run_test` instead of `run_step_by_step` for faster execution

## Advanced Usage

### Custom Test Patterns

```javascript
// In codecept.conf.js
export const config = {
  tests: './tests/**/*_test.js',
  // ... rest of config
}
```

### AI-Friendly Trace Integration

For best results with AI agents:

1. **Enable aiTrace plugin** in config (automatically enabled for `run_step_by_step`)
2. **Use descriptive test names** for better trace file organization
3. **Keep tests focused** - one scenario per test for clearer traces
4. **Add assertions with clear messages** - better error reporting

### Running Tests from Different Directories

```json
{
  "mcpServers": {
    "codeceptjs": {
      "command": "node",
      "args": ["node_modules/codeceptjs/bin/mcp-server.js"],
      "env": {
        "CODECEPTJS_CONFIG": "/absolute/path/to/codecept.conf.js",
        "CODECEPTJS_PROJECT_DIR": "/absolute/path/to/project"
      }
    }
  }
}
```

## Security Considerations

- MCP server runs with same permissions as calling process
- `run_code` allows arbitrary CodeceptJS execution - use in trusted environments only
- Test files should validate input if exposed to external systems
- Environment variables may contain sensitive paths - secure accordingly

## Contributing

When contributing to MCP server:

1. Add tests for new tools in `test/mcp/mcp_server_test.js`
2. Update this documentation with new tools/parameters
3. Ensure error handling is consistent
4. Test with both Playwright and Puppeteer helpers
5. Verify trace files are generated correctly for `run_step_by_step`

## License

MIT
