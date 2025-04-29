#!/usr/bin/env node

const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const path = require('path')
const fs = require('fs')

// Import core CodeceptJS modules
const Codecept = require('../lib/codecept')
const container = require('../lib/container')
const { getParamsToString } = require('../lib/parser')
const { methodsOfObject } = require('../lib/utils')
const output = require('../lib/output')
const { getConfig, getTestRoot } = require('../lib/command/utils')

// Simple path handling - use argument if provided, otherwise use current directory

const lastArg = process.argv[process.argv.length - 1]

const customPath = lastArg.includes('mcp.js') ? process.cwd() : lastArg

/**
 * Start MCP Server
 */
async function startServer() {
  // Disable default output
  output.print = () => {}

  // Initialize CodeceptJS
  const testsPath = getTestRoot(customPath)
  const config = getConfig(customPath)
  const codecept = new Codecept(config, {})

  codecept.init(testsPath)
  codecept.loadTests()

  // Setup MCP server
  const server = new McpServer({
    name: 'CodeceptJS',
    version: '1.0.0',
    url: 'https://codecept.io',
    description: 'CodeceptJS Model Context Protocol Server',
  })

  // Convert Resource: tests
  server.tool('list-tests', {}, async () => {
    // Use the same approach as dryRun.js to collect test information
    const mocha = container.mocha()
    mocha.files = codecept.testFiles
    mocha.loadFiles()

    const tests = []

    // Iterate through all suites and tests
    for (const suite of mocha.suite.suites) {
      for (const test of suite.tests) {
        tests.push({
          title: test.title,
          fullTitle: test.fullTitle(),
          body: test.body ? test.body.toString() : '',
          file: suite.file,
          suiteName: suite.title,
          meta: test.meta,
          tags: test.tags,
        })
      }
    }

    // Format each test as a readable text block
    const formattedText = tests
      .map(test => {
        return [`Test: ${test.fullTitle}`, `File: ${test.file}`, `Suite: ${test.suiteName}`, test.tags && test.tags.length ? `Tags: ${test.tags?.join(', ')}` : '', '', 'Body:', test.body, '---']
          .filter(Boolean)
          .join('\n')
      })
      .join('\n\n')

    return {
      content: [{ type: 'text', text: formattedText }],
    }
  })

  // Convert Resource: suites
  server.tool('list-suites', {}, async () => {
    // Use the same approach as dryRun.js to collect suite information
    const mocha = container.mocha()
    mocha.files = codecept.testFiles
    mocha.loadFiles()

    const suites = []

    // Iterate through all suites
    for (const suite of mocha.suite.suites) {
      suites.push({
        title: suite.title,
        file: suite.file,
        testCount: suite.tests.length,
        tests: suite.tests.map(test => ({
          title: test.title,
          fullTitle: test.fullTitle(),
        })),
      })
    }

    // Format each suite as a readable text block
    const formattedText = suites
      .map(suite => {
        const testList = suite.tests.map(test => `  - ${test.title}`).join('\n')
        return [`Suite: ${suite.title}`, `File: ${suite.file}`, `Tests (${suite.testCount}):`, testList, '---'].join('\n')
      })
      .join('\n\n')

    return {
      content: [{ type: 'text', text: formattedText }],
    }
  })

  // // Convert Resource: actions
  // server.tool("list-actions",
  //   { },
  //   async () => {
  //     const helpers = container.helpers();
  //     const supportI = container.support('I');
  //     const actions = [];

  //     // Get actions from helpers
  //     for (const name in helpers) {
  //       const helper = helpers[name];
  //       methodsOfObject(helper).forEach(action => {
  //         const params = getParamsToString(helper[action]);
  //         actions.push({
  //           name: action,
  //           source: name,
  //           params,
  //           type: 'helper'
  //         });
  //       });
  //     }

  //     // Get actions from I
  //     for (const name in supportI) {
  //       if (actions.some(a => a.name === name)) {
  //         continue;
  //       }
  //       const actor = supportI[name];
  //       const params = getParamsToString(actor);
  //       actions.push({
  //         name,
  //         source: 'I',
  //         params,
  //         type: 'support'
  //       });
  //     }

  //     // Format actions as a readable text list
  //     const helperActions = actions.filter(a => a.type === 'helper')
  //       .sort((a, b) => a.source === b.source ? a.name.localeCompare(b.name) : a.source.localeCompare(b.source));

  //     const supportActions = actions.filter(a => a.type === 'support')
  //       .sort((a, b) => a.name.localeCompare(b.name));

  //     // Create formatted text output
  //     const formattedText = [
  //       '# Helper Actions',
  //       ...helperActions.map(a => `${a.source}.${a.name}(${a.params})`),
  //       '',
  //       '# Support Actions',
  //       ...supportActions.map(a => `I.${a.name}(${a.params})`)
  //     ].join('\n');

  //     return {
  //       content: [{ type: "text", text: formattedText }]
  //     };
  //   }
  // );
  // Start MCP server using stdio transport
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

// Start the server without nested error handling
startServer().catch(err => {
  console.error(err)
  process.exit(1)
})
