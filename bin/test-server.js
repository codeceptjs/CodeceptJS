#!/usr/bin/env node

/**
 * Standalone test server script to replace json-server
 */

const path = require('path')
const TestServer = require('../lib/test-server')

// Parse command line arguments
const args = process.argv.slice(2)
let dbFile = path.join(__dirname, '../test/data/rest/db.json')
let port = 8010
let host = '0.0.0.0'

// Simple argument parsing
for (let i = 0; i < args.length; i++) {
  const arg = args[i]

  if (arg === '-p' || arg === '--port') {
    port = parseInt(args[++i])
  } else if (arg === '--host') {
    host = args[++i]
  } else if (!arg.startsWith('-')) {
    dbFile = path.resolve(arg)
  }
}

// Create and start server
const server = new TestServer({ port, host, dbFile })

console.log(`Starting test server with db file: ${dbFile}`)

server
  .start()
  .then(() => {
    console.log(`Test server is ready and listening on http://${host}:${port}`)
  })
  .catch(err => {
    console.error('Failed to start test server:', err)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down test server...')
  server.stop().then(() => process.exit(0))
})

process.on('SIGTERM', () => {
  console.log('\nShutting down test server...')
  server.stop().then(() => process.exit(0))
})
