# CodeceptJS Model Context Protocol (MCP) Integration

CodeceptJS supports the Model Context Protocol (MCP) for IDE integration, particularly with Cursor.

## Using with Cursor

To use CodeceptJS with Cursor:

1. Start the MCP server directly using the standalone executable:

```bash
npx codecept-mcp
```

or

```bash
node bin/codecept-mcp.js [path]
```

Where `[path]` is optional and points to your CodeceptJS project (defaults to current directory).

2. In Cursor, connect to the MCP server by selecting "Connect to MCP Server" and choose "CodeceptJS" from the list.

## Available Tools

The server provides these tools:

- `list-tests`: List all availble tests
- `list-suites`: List all suites

## Troubleshooting

If Cursor shows "Found 0 tools, 0 resources, and 0 resource templates" when connecting:

1. Make sure you're using the standalone executable (`codecept-mcp.js`)
2. The MCP server process should be running independently and not as a subprocess
3. Check that you're in the correct CodeceptJS project directory by specifying path as a parameter
4. Verify that your CodeceptJS configuration file (codecept.conf.js or codecept.json) exists in path and is valid
