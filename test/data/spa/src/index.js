import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'

// Hook to get URL parameters and POST data
function usePostData() {
  const [postData, setPostData] = React.useState({})
  const location = useLocation()

  React.useEffect(() => {
    // Check if we're showing POST results
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.has('posted')) {
      // POST data is now handled server-side and shown in the response
      // This hook is mainly for consistency with the original design
      setPostData({})
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

      <div id="grab-multiple">
        <a href="/" id="first-link">
          First
        </a>
        <a href="/info" id="second-link">
          Second
        </a>
      </div>

      <form action="/info" method="POST">
        <p>
          <label>Rus:</label>
          <input type="text" name="rus" />
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

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

  return (
    <div>
      <h1>File Upload</h1>
      <div className="notice" qa-id="test"></div>

      <form action="/form/file" method="POST" encType="multipart/form-data">
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

  return (
    <div>
      <h1>Hidden Form</h1>
      <div className="notice" qa-id="test"></div>

      <form action="/form/hidden" method="POST">
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

// Form Select page component (needed by tests)
function FormSelectPage() {
  const postData = usePostData()

  return (
    <html>
      <body>
        <form action="/form/complex" method="POST">
          <label htmlFor="age">Select your age</label>
          <select name="age" id="age">
            <option value="child">below 13</option>
            <option value="teenage">13-21</option>
            <option value="adult">21-60</option>
            <option value="oldfag" selected="selected">
              60-100
            </option>
            <option value="dead">100-210</option>
          </select>
          <input type="submit" value="Submit" />
        </form>
        {Object.keys(postData).length > 0 && (
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {Object.entries(postData)
              .map(([key, value]) => `[${key}] => ${Array.isArray(value) ? `Array\n(\n    ${value.map((item, index) => `[${index}] => ${item}`).join('\n    ')}\n)` : value}`)
              .join('\n')}
          </pre>
        )}
      </body>
    </html>
  )
}

// Form Field page component (needed by tests)
function FormFieldPage() {
  const postData = usePostData()

  return (
    <div>
      <h1>Form Fields</h1>
      <form action="/form/field" method="POST">
        <p>
          <label>Name:</label>
          <br />
          <input type="text" name="name" placeholder="Enter your name" />
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

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

// Form Checkbox page component (needed by tests)
function FormCheckboxPage() {
  const postData = usePostData()

  return (
    <div>
      <h1>Checkbox Form</h1>
      <form action="/form/checkbox" method="POST">
        <p>
          <label>
            <input type="checkbox" name="agree" value="yes" /> I agree to the terms
          </label>
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

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

// Form Button page component (needed by tests)
function FormButtonPage() {
  const postData = usePostData()

  return (
    <div>
      <h1>Button Form</h1>
      <form action="/form/button" method="POST">
        <p>
          <button type="submit" name="action" value="save">
            Save
          </button>
          <button type="submit" name="action" value="delete">
            Delete
          </button>
        </p>
      </form>

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

// Generic Form Complex page (catches form submissions)
function FormComplexPage() {
  const postData = usePostData()

  return (
    <div>
      <h1>Form Submitted Successfully</h1>
      <p>
        <a href="/">Back to index</a>
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

// Form Textarea page component
function FormTextareaPage() {
  return (
    <div>
      <h1>Textarea Form</h1>
      <form action="/form/complex" method="POST">
        <p>
          <label>Message:</label>
          <br />
          <textarea name="message" rows="4" cols="50" placeholder="Enter your message"></textarea>
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

      <div id="grab-multiple">
        <a href="/" id="first-link">
          First
        </a>
        <a href="/info" id="second-link">
          Second
        </a>
      </div>
    </div>
  )
}

// Form Aria page component
function FormAriaPage() {
  return (
    <div>
      <h1>Aria Form</h1>
      <form action="/form/complex" method="POST">
        <p>
          <label aria-label="Username input">Username:</label>
          <input type="text" name="username" aria-required="true" />
        </p>
        <p>
          <input type="submit" value="Submit" aria-label="Submit form" />
        </p>
      </form>
    </div>
  )
}

// Form Example1 page component
function FormExample1Page() {
  return (
    <div>
      <h1>Example Form 1</h1>
      <form action="/form/complex" method="POST">
        <p>
          <label>Example field:</label>
          <input type="text" name="example" />
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>
    </div>
  )
}

// Form Example7 page component
function FormExample7Page() {
  return (
    <div>
      <h1>Example Form 7</h1>
      <form action="/form/complex" method="POST">
        <p>
          <label>Example field 7:</label>
          <input type="text" name="example7" />
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>
    </div>
  )
}

// Form Wait Element page component
function FormWaitElementPage() {
  const [showElement, setShowElement] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShowElement(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      <h1>Wait Element Form</h1>
      {showElement && (
        <form action="/form/complex" method="POST">
          <p>
            <label>Wait field:</label>
            <input type="text" name="waitfield" />
          </p>
          <p>
            <input type="submit" value="Submit" />
          </p>
        </form>
      )}
    </div>
  )
}

// Custom Locator Strategies test page
function CustomLocatorStrategiesPage() {
  return (
    <div role="main">
      <nav role="navigation" data-qa="nav-section">
        <a href="/" aria-label="Home link">
          Home
        </a>
        <a href="/about" aria-label="About link">
          About
        </a>
        <a href="/contact" aria-label="Contact link">
          Contact
        </a>
      </nav>

      <h1 data-testid="page-title" aria-label="Welcome Message">
        Custom Locator Test Page
      </h1>

      <div role="complementary" data-qa="info-section">
        <p data-testid="info-text" aria-label="Information message">
          This is a test page for custom locators.
        </p>
      </div>

      <form role="form" data-qa="test-form" action="/form/complex" method="POST">
        <div data-qa="form-section">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" data-testid="username-input" aria-label="Username field" placeholder="Enter your username" />
        </div>

        <div data-qa="form-section">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" data-testid="password-input" aria-label="Password field" placeholder="Enter your password" />
        </div>

        <div>
          <button type="submit" role="button" data-testid="submit-button" data-qa="submit-btn" aria-label="Submit form">
            Submit
          </button>
          <button type="button" data-testid="cancel-button" data-qa="cancel-btn" aria-label="Cancel form">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// Login page component
function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <form action="/login" method="POST">
        <p>
          <label htmlFor="email">Email:</label>
          <br />
          <input type="email" id="email" name="email" placeholder="Enter your email" />
        </p>
        <p>
          <label htmlFor="password">Password:</label>
          <br />
          <input type="password" id="password" name="password" placeholder="Enter your password" />
        </p>
        <p>
          <input type="submit" value="Login" />
        </p>
      </form>
      <p>
        <a href="/">Back to index</a>
      </p>
    </div>
  )
}

// Bug 1467 form page component
function FormBug1467Page() {
  const location = useLocation()
  const sessionTag = location.hash ? location.hash.substring(1) : 'default'

  return (
    <div>
      <h1>Bug 1467 Form ({sessionTag})</h1>
      <p>TEST TEST</p>

      <form name="form1" action="/form/bug1467" method="POST">
        <h3>Form 1</h3>
        <p>
          <label>
            <input type="checkbox" name="first_test_radio" value="Yes" /> Yes
          </label>
        </p>
        <p>
          <label>
            <input type="checkbox" name="first_test_radio" value="No" /> No
          </label>
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

      <form name="form2" action="/form/bug1467" method="POST">
        <h3>Form 2</h3>
        <p>
          <label>
            <input type="checkbox" name="first_test_radio" value="Yes" /> Yes
          </label>
        </p>
        <p>
          <label>
            <input type="checkbox" name="first_test_radio" value="No" /> No
          </label>
        </p>
        <p>
          <input type="submit" value="Submit" />
        </p>
      </form>

      <p>
        <a href="/">Back to index</a>
      </p>
    </div>
  )
}

// Iframe page component
function IframePage() {
  return (
    <div>
      <h1>Iframe Test Page</h1>
      <iframe name="content" src="/iframe_content" width="400" height="300" title="Test iframe"></iframe>
      <p>
        <a href="/">Back to index</a>
      </p>
    </div>
  )
}

// Iframe nested page component
function IframeNestedPage() {
  return (
    <div>
      <h1>Nested Iframe Test Page</h1>
      <iframe name="wrapper" id="wrapperId" className="wrapperClass" src="/iframe_wrapper" width="500" height="400" title="Wrapper iframe"></iframe>
      <p>
        <a href="/">Back to index</a>
      </p>
    </div>
  )
}

// Iframe content component (for the simple iframe)
function IframeContentPage() {
  return (
    <html>
      <head>
        <title>Iframe Content</title>
      </head>
      <body>
        <h1>Inside Iframe</h1>
        <form action="/iframe_content" method="POST">
          <p>
            <label>Rus:</label>
            <input type="text" name="rus" />
          </p>
          <p>
            <input type="submit" value="Sign in!" />
          </p>
        </form>
      </body>
    </html>
  )
}

// Iframe wrapper component (for nested iframe)
function IframeWrapperPage() {
  return (
    <html>
      <head>
        <title>Iframe Wrapper</title>
      </head>
      <body>
        <h1>Wrapper Iframe</h1>
        <iframe name="content" src="/iframe_content" width="300" height="200" title="Inner iframe"></iframe>
      </body>
    </html>
  )
}

// Main App component with routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/iframe" element={<IframePage />} />
        <Route path="/iframe_nested" element={<IframeNestedPage />} />
        <Route path="/iframe_content" element={<IframeContentPage />} />
        <Route path="/iframe_wrapper" element={<IframeWrapperPage />} />
        <Route path="/form/file" element={<FormFilePage />} />
        <Route path="/form/hidden" element={<FormHiddenPage />} />
        <Route path="/form/select" element={<FormSelectPage />} />
        <Route path="/form/field" element={<FormFieldPage />} />
        <Route path="/form/checkbox" element={<FormCheckboxPage />} />
        <Route path="/form/button" element={<FormButtonPage />} />
        <Route path="/form/textarea" element={<FormTextareaPage />} />
        <Route path="/form/aria" element={<FormAriaPage />} />
        <Route path="/form/example1" element={<FormExample1Page />} />
        <Route path="/form/example7" element={<FormExample7Page />} />
        <Route path="/form/wait_element" element={<FormWaitElementPage />} />
        <Route path="/form/custom_locator_strategies" element={<CustomLocatorStrategiesPage />} />
        <Route path="/form/bug1467" element={<FormBug1467Page />} />
        <Route path="/form/complex" element={<FormComplexPage />} />
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
