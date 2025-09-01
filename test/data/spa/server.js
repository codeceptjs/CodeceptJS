const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const PORT = 8000
const DIST_DIR = path.join(__dirname, 'dist')

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // Check if it's a static file request
  const ext = path.extname(pathname)
  if (ext && mimeTypes[ext]) {
    const filePath = path.join(DIST_DIR, pathname)

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('File not found')
        return
      }

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] })
      res.end(data)
    })
    return
  }

  // For all other requests (React routes), serve index.html
  const indexPath = path.join(DIST_DIR, 'index.html')

  fs.readFile(indexPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Error loading index.html')
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(data)
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`React SPA server running at http://127.0.0.1:${PORT}/`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  server.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
})
