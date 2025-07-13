# CodeceptJS MCP Server for Cursor IDE

This project includes a Model Context Protocol (MCP) server for integration with Cursor IDE. The MCP server provides context-aware assistance for working with CodeceptJS tests.

## Available Resources

When using Cursor with this project, you'll have access to the following resources:

- **CodeceptJS Tests** - Complete list of tests with file locations and test bodies
- **Test Suites** - Organized view of test suites and their tests
- **Available Actions** - List of all helper and actor (I) actions that can be used in tests

## How to Use

1. Open this project in Cursor IDE
2. The MCP server will automatically start when needed
3. When writing or editing tests, you can reference:
   - Existing tests using `/tests`
   - Test suites using `/suites`
   - Available actions using `/actions`

## Example

When writing a test, you can ask Cursor about available actions:

```
Can you show me what actions are available for filling out forms?
```

Or inquire about existing tests:

```
Show me the login tests in this project
```

## Troubleshooting

If the MCP server isn't connecting:

1. Make sure all dependencies are installed with `npm install`
2. Try restarting Cursor
3. Check that the `codeceptjs mcp` command works from the terminal
