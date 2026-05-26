import express from 'express'
const app = express()
app.use(express.json())

// Example users data
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
]

// Example comments data
let comments = [{ id: 1, postId: 1, text: 'Great post!' }]

// GET /api/users
app.get('/api/users', (req, res) => {
  res.json({ data: users })
})

// GET /api/comments/:id
app.get('/api/comments/:id', (req, res) => {
  const comment = comments.find(c => c.id === parseInt(req.params.id))
  if (comment) {
    return res.json({
      data: comment,
      support: {
        url: 'http://example.com/support',
        text: 'Support information',
      },
    })
  }
  res.status(404).json({ error: 'Comment not found' })
})

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id))
  if (user) return res.json(user)
  res.status(404).json({ error: 'User not found' })
})

// POST /api/users
app.post('/api/users', (req, res) => {
  const { name, email } = req.body
  const newUser = { id: users.length + 1, name, email }
  users.push(newUser)
  res.status(201).json(newUser)
})

// PUT /api/users/:id
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  user.name = req.body.name || user.name
  user.email = req.body.email || user.email
  res.json(user)
})

// DELETE /api/users/:id
app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== parseInt(req.params.id))
  res.status(204).send()
})

// Start server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Mock REST server running on port ${PORT}`)
})
