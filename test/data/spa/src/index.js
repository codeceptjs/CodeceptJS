import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'

// Hook to get URL parameters and POST data from localStorage
function usePostData() {
  const [postData, setPostData] = React.useState({})
  const location = useLocation()

  React.useEffect(() => {
    // Check if we're coming from a POST
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.has('posted')) {
      // Get POST data from localStorage
      try {
        const storedData = localStorage.getItem('codeceptjs_post_data')
        if (storedData) {
          setPostData(JSON.parse(storedData))
          // Clear the POST data after displaying
          localStorage.removeItem('codeceptjs_post_data')
        }
      } catch (error) {
        setPostData({})
      }
    } else {
      setPostData({})
    }
  }, [location])

  return postData
}

// Main index page component
function IndexPage() {
  const postData = usePostData()
  const location = useLocation()
  const notice = location.state?.notice

  return (
    <div>
      <h1 data-testid="welcome">Welcome to test app!</h1>
      <h2>With&nbsp;special&nbsp;space chars</h2>
      <div className="notice" qa-id="test">
        {notice || ''}
      </div>
      <p>
        <a href="/info" id="link" qa-id="test" qa-link="test">
          More info
        </a>
      </p>
      <div id="area1" qa-id="test">
        <a href="/form/file" qa-id="test" qa-link="test">
          {' '}
          Test Link{' '}
        </a>
      </div>
      <div id="area2" qa-id="test">
        <a href="/form/hidden" qa-id="test" qa-link="test">
          Test
        </a>
      </div>
      <div id="area3" qa-id="test">
        <a href="info" qa-id="test" qa-link="test">
          Document-Relative Link
        </a>
      </div>
      <div id="area4" qa-id="test">
        <a href="/spinner" qa-id="test" qa-link="test">
          Spinner
        </a>
      </div>
      <div id="area5" qa-id="test">
        <input qa-id="test" qa-link="test" disabled />
      </div>
      A wise man said: "debug!"
      {Object.keys(postData).length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {Object.entries(postData)
            .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}

// Info page component
function InfoPage() {
  const postData = usePostData()

  return (
    <div>
      <h1>Information</h1>
      <div className="notice" qa-id="test"></div>
      <p>
        <a href="/" id="link" qa-id="test" qa-link="test">
          Back to index
        </a>
      </p>
      {Object.keys(postData).length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {Object.entries(postData)
            .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}

// Form file page component
function FormFilePage() {
  const postData = usePostData()
  const navigate = useNavigate()

  const handleSubmit = e => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {}

    // Handle file uploads and regular fields
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        // For file uploads, store file info (name, size, type)
        data[key] = `${value.name} (${value.size} bytes, ${value.type})`
      } else {
        data[key] = value
      }
    }

    // Store in localStorage and redirect
    localStorage.setItem('codeceptjs_post_data', JSON.stringify(data))
    navigate('/?posted=1')
  }

  return (
    <div>
      <h1>File Upload</h1>
      <div className="notice" qa-id="test"></div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <p>
          <label>Upload a file:</label>
          <br />
          <input type="file" name="attachment" />
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

      <p>
        <a href="/" qa-id="test" qa-link="test">
          Back to index
        </a>
      </p>

      {Object.keys(postData).length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {Object.entries(postData)
            .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}

// Form hidden page component
function FormHiddenPage() {
  const postData = usePostData()
  const navigate = useNavigate()

  const handleSubmit = e => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {}

    for (let [key, value] of formData.entries()) {
      data[key] = value
    }

    // Store in localStorage and redirect
    localStorage.setItem('codeceptjs_post_data', JSON.stringify(data))
    navigate('/?posted=1')
  }

  return (
    <div>
      <h1>Hidden Form</h1>
      <div className="notice" qa-id="test"></div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="hidden_field" value="hidden_value" />
        <p>
          <label>Visible field:</label>
          <br />
          <input type="text" name="visible_field" placeholder="Enter something" />
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

      <p>
        <a href="/" qa-id="test" qa-link="test">
          Back to index
        </a>
      </p>

      {Object.keys(postData).length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {Object.entries(postData)
            .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}

// Spinner page component
function SpinnerPage() {
  const [loading, setLoading] = React.useState(true)
  const postData = usePostData()

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      <h1>Loading page...</h1>
      <div className="notice" qa-id="test"></div>

      {loading ? <div id="spinner">Loading...</div> : <div>Content has loaded!</div>}

      <p>
        <a href="/" qa-id="test" qa-link="test">
          Back to index
        </a>
      </p>

      {Object.keys(postData).length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {Object.entries(postData)
            .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}

// Search page component
function SearchPage() {
  const postData = usePostData()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)

  return (
    <div>
      <h1>Search Results</h1>
      <div className="notice" qa-id="test"></div>

      {searchParams.size > 0 && (
        <div>
          <h2>Query parameters:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {Array.from(searchParams.entries())
              .map(([key, value]) => `[${key}] => ${value}`)
              .join('\n')}
          </pre>
        </div>
      )}

      <p>
        <a href="/" qa-id="test" qa-link="test">
          Back to index
        </a>
      </p>

      {Object.keys(postData).length > 0 && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {Object.entries(postData)
            .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
            .join('\n')}
        </pre>
      )}
    </div>
  )
}

// Main App component with routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/form/file" element={<FormFilePage />} />
        <Route path="/form/hidden" element={<FormHiddenPage />} />
        <Route path="/spinner" element={<SpinnerPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<IndexPage />} />
      </Routes>
    </Router>
  )
}

// Initialize the React app
const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
