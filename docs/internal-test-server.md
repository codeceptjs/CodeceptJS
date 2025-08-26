# Internal API Test Server

This directory contains the internal API test server implementation that replaces the third-party `json-server` dependency.

## Files

- `lib/test-server.js` - Main TestServer class implementation
- `bin/test-server.js` - CLI script to run the server standalone

## Usage

### As npm script:

```bash
npm run test-server
```

### Directly:

```bash
node bin/test-server.js [options] [db-file]
```

### Options:

- `-p, --port <port>` - Port to listen on (default: 8010)
- `--host <host>` - Host to bind to (default: 0.0.0.0)
- `db-file` - Path to JSON database file (default: test/data/rest/db.json)

## Features

- **Full REST API compatibility** with json-server
- **Automatic file watching** - Reloads data when db.json file changes
- **CORS support** - Allows cross-origin requests for testing
- **Custom headers support** - Handles special headers like X-Test
- **File upload endpoints** - Basic file upload simulation
- **Express.js based** - Uses familiar Express.js framework

## API Endpoints

The server provides the same API endpoints as json-server:

### Users

- `GET /user` - Get user data
- `POST /user` - Create/update user
- `PATCH /user` - Partially update user
- `PUT /user` - Replace user

### Posts

- `GET /posts` - Get all posts
- `GET /posts/:id` - Get specific post
- `POST /posts` - Create new post
- `PUT /posts/:id` - Replace specific post
- `PATCH /posts/:id` - Partially update specific post
- `DELETE /posts/:id` - Delete specific post

### Comments

- `GET /comments` - Get all comments
- `POST /comments` - Create new comment
- `DELETE /comments/:id` - Delete specific comment

### Utility

- `GET /headers` - Return request headers (for testing)
- `POST /headers` - Return request headers (for testing)
- `POST /upload` - File upload simulation
- `POST /_reload` - Manually reload database file

## Migration from json-server

This server is designed as a drop-in replacement for json-server. The key differences:

1. **No CLI options** - Configuration is done through constructor options or CLI args
2. **Automatic file watching** - No need for `--watch` flag
3. **Built-in middleware** - Headers and CORS are handled automatically
4. **Simpler file upload** - Basic implementation without full multipart support

## Testing

The server is used by the following test suites:

- `test/rest/REST_test.js` - REST helper tests
- `test/rest/ApiDataFactory_test.js` - API data factory tests
- `test/helper/JSONResponse_test.js` - JSON response helper tests

All tests pass with the internal server, proving full compatibility.
