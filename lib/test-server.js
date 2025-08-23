const express = require('express')
const fs = require('fs')
const path = require('path')

/**
 * Internal API test server to replace json-server dependency
 * Provides REST API endpoints for testing CodeceptJS helpers
 */
class TestServer {
  constructor(config = {}) {
    this.app = express()
    this.server = null
    this.port = config.port || 8010
    this.host = config.host || 'localhost'
    this.dbFile = config.dbFile || path.join(__dirname, '../test/data/rest/db.json')
    this.lastModified = null
    this.data = this.loadData()

    this.setupMiddleware()
    this.setupRoutes()
    this.setupFileWatcher()
  }

  loadData() {
    try {
      const content = fs.readFileSync(this.dbFile, 'utf8')
      const data = JSON.parse(content)
      // Update lastModified time when loading data
      if (fs.existsSync(this.dbFile)) {
        this.lastModified = fs.statSync(this.dbFile).mtime
      }
      console.log('[Data Load] Loaded data from file:', JSON.stringify(data))
      return data
    } catch (err) {
      console.warn(`[Data Load] Could not load data file ${this.dbFile}:`, err.message)
      console.log('[Data Load] Using fallback default data')
      return {
        posts: [{ id: 1, title: 'json-server', author: 'davert' }],
        user: { name: 'john', password: '123456' },
      }
    }
  }

  reloadData() {
    console.log('[Reload] Reloading data from file...')
    this.data = this.loadData()
    console.log('[Reload] Data reloaded successfully')
    return this.data
  }

  saveData() {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2))
      console.log('[Save] Data saved to file')
      // Force update modification time to ensure auto-reload works
      const now = new Date()
      fs.utimesSync(this.dbFile, now, now)
      this.lastModified = now
      console.log('[Save] File modification time updated')
    } catch (err) {
      console.warn(`[Save] Could not save data file ${this.dbFile}:`, err.message)
    }
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json())

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }))

    // CORS support
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Test')

      if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
      }
      next()
    })

    // Auto-reload middleware - check if file changed before each request
    this.app.use((req, res, next) => {
      try {
        if (fs.existsSync(this.dbFile)) {
          const stats = fs.statSync(this.dbFile)
          if (!this.lastModified || stats.mtime > this.lastModified) {
            console.log(`[Auto-reload] Database file changed (${this.dbFile}), reloading data...`)
            console.log(`[Auto-reload] Old mtime: ${this.lastModified}, New mtime: ${stats.mtime}`)
            this.reloadData()
            this.lastModified = stats.mtime
            console.log(`[Auto-reload] Data reloaded, user name is now: ${this.data.user?.name}`)
          }
        }
      } catch (err) {
        console.warn('[Auto-reload] Error checking file modification time:', err.message)
      }
      next()
    })

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`)
      next()
    })
  }

  setupRoutes() {
    // Reload endpoint (for testing)
    this.app.post('/_reload', (req, res) => {
      this.reloadData()
      res.json({ message: 'Data reloaded', data: this.data })
    })

    // Headers endpoint (for header testing)
    this.app.get('/headers', (req, res) => {
      res.json(req.headers)
    })

    this.app.post('/headers', (req, res) => {
      res.json(req.headers)
    })

    // User endpoints
    this.app.get('/user', (req, res) => {
      console.log(`[GET /user] Serving user data: ${JSON.stringify(this.data.user)}`)
      res.json(this.data.user)
    })

    this.app.post('/user', (req, res) => {
      this.data.user = { ...this.data.user, ...req.body }
      this.saveData()
      res.status(201).json(this.data.user)
    })

    this.app.patch('/user', (req, res) => {
      this.data.user = { ...this.data.user, ...req.body }
      this.saveData()
      res.json(this.data.user)
    })

    this.app.put('/user', (req, res) => {
      this.data.user = req.body
      this.saveData()
      res.json(this.data.user)
    })

    // Posts endpoints
    this.app.get('/posts', (req, res) => {
      res.json(this.data.posts)
    })

    this.app.get('/posts/:id', (req, res) => {
      const id = parseInt(req.params.id)
      const post = this.data.posts.find(p => p.id === id)

      if (!post) {
        // Return empty object instead of 404 for json-server compatibility
        return res.json({})
      }

      res.json(post)
    })

    this.app.post('/posts', (req, res) => {
      const newId = Math.max(...this.data.posts.map(p => p.id || 0)) + 1
      const newPost = { id: newId, ...req.body }

      this.data.posts.push(newPost)
      this.saveData()
      res.status(201).json(newPost)
    })

    this.app.put('/posts/:id', (req, res) => {
      const id = parseInt(req.params.id)
      const postIndex = this.data.posts.findIndex(p => p.id === id)

      if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' })
      }

      this.data.posts[postIndex] = { id, ...req.body }
      this.saveData()
      res.json(this.data.posts[postIndex])
    })

    this.app.patch('/posts/:id', (req, res) => {
      const id = parseInt(req.params.id)
      const postIndex = this.data.posts.findIndex(p => p.id === id)

      if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' })
      }

      this.data.posts[postIndex] = { ...this.data.posts[postIndex], ...req.body }
      this.saveData()
      res.json(this.data.posts[postIndex])
    })

    this.app.delete('/posts/:id', (req, res) => {
      const id = parseInt(req.params.id)
      const postIndex = this.data.posts.findIndex(p => p.id === id)

      if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' })
      }

      const deletedPost = this.data.posts.splice(postIndex, 1)[0]
      this.saveData()
      res.json(deletedPost)
    })

    // File upload endpoint (basic implementation)
    this.app.post('/upload', (req, res) => {
      // Simple upload simulation - for more complex file uploads,
      // multer would be needed but basic tests should work
      res.json({
        message: 'File upload endpoint available',
        headers: req.headers,
        body: req.body,
      })
    })

    // Comments endpoints (for ApiDataFactory tests)
    this.app.get('/comments', (req, res) => {
      res.json(this.data.comments || [])
    })

    this.app.post('/comments', (req, res) => {
      if (!this.data.comments) this.data.comments = []
      const newId = Math.max(...this.data.comments.map(c => c.id || 0), 0) + 1
      const newComment = { id: newId, ...req.body }

      this.data.comments.push(newComment)
      this.saveData()
      res.status(201).json(newComment)
    })

    this.app.delete('/comments/:id', (req, res) => {
      if (!this.data.comments) this.data.comments = []
      const id = parseInt(req.params.id)
      const commentIndex = this.data.comments.findIndex(c => c.id === id)

      if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comment not found' })
      }

      const deletedComment = this.data.comments.splice(commentIndex, 1)[0]
      this.saveData()
      res.json(deletedComment)
    })

    // Generic catch-all for other endpoints
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' })
    })
  }

  setupFileWatcher() {
    if (fs.existsSync(this.dbFile)) {
      fs.watchFile(this.dbFile, (current, previous) => {
        if (current.mtime !== previous.mtime) {
          console.log('Database file changed, reloading data...')
          this.reloadData()
        }
      })
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, err => {
        if (err) {
          reject(err)
        } else {
          console.log(`Test server running on http://${this.host}:${this.port}`)
          resolve(this.server)
        }
      })
    })
  }

  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          console.log('Test server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

module.exports = TestServer

// CLI usage
if (require.main === module) {
  const config = {
    port: process.env.PORT || 8010,
    host: process.env.HOST || '0.0.0.0',
    dbFile: process.argv[2] || path.join(__dirname, '../test/data/rest/db.json'),
  }

  const server = new TestServer(config)
  server.start().catch(console.error)

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down test server...')
    server.stop().then(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    console.log('\nShutting down test server...')
    server.stop().then(() => process.exit(0))
  })
}
