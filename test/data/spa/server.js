const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const querystring = require('querystring')

const PORT = 8000
const DIST_DIR = path.join(__dirname, 'dist')
const DATA_FILE = path.join(__dirname, '../app/db')

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

// Parse POST data from request
function parsePostData(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const contentType = req.headers['content-type'] || ''
        if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve(querystring.parse(body))
        } else {
          resolve({})
        }
      } catch (err) {
        reject(err)
      }
    })
  })
}

// Write form data to file in format expected by tests
function writeFormData(formData) {
  try {
    const data = {
      form: formData,
      timestamp: new Date().toISOString(),
    }

    // Ensure the directory exists
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing form data:', error)
  }
}

const server = http.createServer(async (req, res) => {
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

  // Handle POST requests
  if (req.method === 'POST') {
    try {
      const postData = await parsePostData(req)

      // Write form data to file for tests
      if (Object.keys(postData).length > 0) {
        writeFormData(postData)
      }

      // Redirect to success page or back to form
      res.writeHead(302, {
        Location: pathname.includes('/form/') ? '/?posted=1' : '/',
      })
      res.end()
      return
    } catch (error) {
      console.error('Error handling POST:', error)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Error processing form data')
      return
    }
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
