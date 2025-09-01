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

  // Special server-side routes that need non-React handling
  if (pathname === '/download') {
    // File download route
    const avatarPath = path.join(__dirname, '../app/avatar.jpg')
    if (fs.existsSync(avatarPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="avatar.jpg"',
        'Content-Length': fs.statSync(avatarPath).size
      })
      fs.createReadStream(avatarPath).pipe(res)
      return
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('File not found')
      return
    }
  }

  // Redirect routes that need server-side handling
  const redirectRoutes = {
    '/redirect': '/info',
    '/redirect2': '/info',
    '/redirect3': '/info', 
    '/redirect4': '/search?ln=test@gmail.com&sn=testnumber',
    '/redirect_long': '/info',
    '/redirect_params': '/info',
    '/redirect_twice': '/redirect3',
    '/relative_redirect': 'info',
    '/relative/redirect': 'info',
    '/redirect_self': req.url,
    '/somepath/redirect_base_uri_has_path': '/somepath/info',
    '/somepath/redirect_base_uri_has_path_302': '/somepath/info'
  }
  
  if (redirectRoutes[pathname]) {
    const location = redirectRoutes[pathname]
    const statusCode = pathname.includes('_302') ? 302 : 301
    res.writeHead(statusCode, { 'Location': location })
    res.end()
    return
  }

  // Basic auth route
  if (pathname === '/auth') {
    const auth = req.headers['authorization']
    if (!auth) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="test"',
        'Content-Type': 'text/html'
      })
      res.end('Unauthorized')
      return
    }
    
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':')
    if (credentials[1] === 'password') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`Welcome, ${credentials[0]}`)
      return
    } else {
      res.writeHead(403, { 'Content-Type': 'text/html' })
      res.end('Forbidden')
      return
    }
  }

  // Content type routes
  if (pathname === '/content-iso') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=iso-8859-1' })
    res.end('<h1>ISO Content</h1>')
    return
  }
  
  if (pathname === '/content-cp1251') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=cp1251' })
    res.end('<h1>CP1251 Content</h1>')
    return
  }

  // Cookie routes
  if (pathname === '/cookies') {
    const cookies = req.headers.cookie
    if (cookies && cookies.includes('foo=bar1') && cookies.includes('baz=bar2')) {
      res.writeHead(302, { 'Location': '/info' })
      res.end()
    } else {
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Set-Cookie': ['foo=bar1; Path=/', 'baz=bar2; Path=/']
      })
      res.end(`
        <html>
          <body>
            <h1>Set Cookies</h1>
            <form method="POST" action="/cookies">
              <input type="submit" value="Submit" />
            </form>
          </body>
        </html>
      `)
    }
    return
  }

  if (pathname === '/cookies2') {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Set-Cookie': ['a=b; Path=/', 'c=d; Path=/']
    })
    res.end('<h1>Cookies Set via Header</h1>')
    return
  }

  if (pathname === '/unset-cookie') {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Set-Cookie': 'a=; Expires=Thu, 01 Jan 1970 00:00:01 GMT'
    })
    res.end('<h1>Cookie Unset</h1>')
    return
  }

  // Timeout route
  if (pathname === '/timeout') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<h1>Delayed Response</h1>')
    }, 5000)
    return
  }

  // External URL route
  if (pathname === '/external_url') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <html>
        <body>
          <h1>External Links</h1>
          <a href="http://example.com">External link</a>
        </body>
      </html>
    `)
    return
  }

  // Facebook route
  if (pathname === '/facebook') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <html>
        <body>
          <h1>Facebook Integration</h1>
          <p>Facebook-like content for testing</p>
        </body>
      </html>
    `)
    return
  }

  // Articles REST API routes
  if (pathname === '/articles') {
    if (req.method === 'DELETE') {
      res.writeHead(204)
      res.end()
      return
    }
    if (req.method === 'PUT') {
      res.writeHead(204)
      res.end()
      return
    }
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
