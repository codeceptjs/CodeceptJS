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

// Form Field Values page component (used 39 times in tests)
function FormFieldValuesPage() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Tests for seeInField</title>
      </head>
      <body>
        <form method="POST" action="/form/complex">
          <input type="checkbox" name="checkbox[]" value="not seen one" />
          <input type="checkbox" name="checkbox[]" value="see test one" defaultChecked />
          <input type="checkbox" name="checkbox[]" value="not seen two" />
          <input type="checkbox" name="checkbox[]" value="see test two" defaultChecked />
          <input type="checkbox" name="checkbox[]" value="not seen three" />
          <input type="checkbox" name="checkbox[]" value="see test three" defaultChecked />
          
          <input type="radio" name="radio1" value="not seen one" />
          <input type="radio" name="radio1" value="see test one" defaultChecked />
          <input type="radio" name="radio1" value="not seen two" />
          <input type="radio" name="radio1" value="not seen three" />
          
          <input type="checkbox" name="checkbox1" value="Boolean Test CB One" defaultChecked />
          <input type="checkbox" name="checkbox2" value="Boolean Test CB Two" />
          
          <input type="radio" name="radio2" value="Boolean Test RD 1" />
          <input type="radio" name="radio2" value="Boolean Test RD 2" defaultChecked />
          <input type="radio" name="radio2" value="Boolean Test RD 3" />
          
          <input type="radio" name="radio3" value="Boolean Test RD 1" />
          <input type="radio" name="radio3" value="Boolean Test RD 2" />
          <input type="radio" name="radio3" value="Boolean Test RD 3" />
          
          <select name="select1">
            <option value="not seen one">Not selected</option>
            <option value="see test one" selected>Selected</option>
            <option value="not seen two">Not selected</option>
            <option value="not seen three">Not selected</option>
          </select>
          
          <select name="select2" multiple>
            <option value="not seen one">Not selected</option>
            <option value="see test one" selected>Selected</option>
            <option value="not seen two">Not selected</option>
            <option value="see test two" selected>Selected</option>
            <option value="not seen three">Not selected</option>
            <option value="see test three" selected>Selected</option>
          </select>
          
          <select name="select3">
            <option value="not seen one">Nothing selected</option>
            <option value="not seen two">Not selected</option>
            <option value="not seen three">Not selected</option>
          </select>
          
          <input type="submit" name="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Wait For Clickable page component (used 29 times in tests)
function FormWaitForClickablePage() {
  React.useEffect(() => {
    const delay = () => {
      setTimeout(() => {
        const button = document.getElementById('publish_button')
        if (button) {
          button.removeAttribute('disabled')
          button.classList.add('ooops')
        }
      }, 500)
    }
    delay()
  }, [])

  return (
    <html>
      <head>
        <style>
          {`
            #notInViewportTop { margin-top: -9999999px }
            #notInViewportBottom { margin-bottom: -9999999px }
            #notInViewportLeft { margin-left: -9999999px }
            #notInViewportRight { margin-right: -9999999px }
          `}
        </style>
      </head>
      <body>
        <input id="text" type="text" name="test" defaultValue="some text" />
        
        <button id="button" type="button" name="button1" disabled value="first">A Button</button>
        
        <div id="notInViewportTop">Div not in viewport by top</div>
        <div id="notInViewportBottom">Div not in viewport by bottom</div>
        <div id="notInViewportLeft">Div not in viewport by left</div>
        <div id="notInViewportRight">Div not in viewport by right</div>
        
        <div id="div1" style={{ position: 'absolute', top: '100px', left: '0' }}>
          <button id="div1_button" type="button" name="button1" value="first">First Button</button>
        </div>
        <div id="div2" style={{ position: 'absolute', top: '100px', left: '0' }}>
          <button id="div2_button" type="button" name="button1" value="first">Second Button</button>
        </div>
        
        <div id="save_button" style={{ position: 'absolute', top: '300px', left: '0' }}>
          <button type="button" name="button_save" value="first" onClick={() => {
            setTimeout(() => {
              const button = document.getElementById('publish_button')
              if (button) {
                button.removeAttribute('disabled')
                button.classList.add('ooops')
              }
            }, 500)
          }}>SAVE</button>
        </div>
        
        <div id="some" style={{ position: 'absolute', top: '400px', left: '0' }}>
          <button className="some" id="publish_button" type="button" name="button_publish" disabled value="first">PUBLISH</button>
        </div>
      </body>
    </html>
  )
}

// Form Popup page component (used 22 times in tests)
function FormPopupPage() {
  const [result, setResult] = React.useState('')
  
  const showConfirm = () => {
    const res = window.confirm("Are you sure?")
    setResult(res ? 'Yes' : 'No')
  }
  
  const showAlert = () => {
    window.alert("Really?")
  }

  return (
    <html>
      <body>
        <h1>Watch our popups</h1>
        
        <div>
          <button onClick={showConfirm}>Confirm</button>
          <button onClick={showAlert}>Alert</button>
          
          <div id="result">{result}</div>
        </div>
      </body>
    </html>
  )
}

// Form Wait Value page component (used 16 times in tests)
function FormWaitValuePage() {
  const [value, setValue] = React.useState('')
  
  React.useEffect(() => {
    const timer = setTimeout(() => setValue('test value'), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Value</h1>
        <input type="text" id="text" name="test" value={value} readOnly />
        <textarea id="textarea" name="message" value={value} readOnly />
      </body>
    </html>
  )
}

// Form Wait Invisible page component (used 16 times in tests)
function FormWaitInvisiblePage() {
  const [visible, setVisible] = React.useState(true)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Invisible</h1>
        {visible && <div id="invisible">This will become invisible</div>}
        <div>Static content</div>
      </body>
    </html>
  )
}

// Form Wait Enabled page component (used 12 times in tests)
function FormWaitEnabledPage() {
  const [enabled, setEnabled] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setEnabled(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Enabled</h1>
        <button id="button" disabled={!enabled}>
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
        <input type="text" id="input" disabled={!enabled} placeholder="Will be enabled" />
      </body>
    </html>
  )
}

// Dynamic page component (used 11 times in tests)
function DynamicPage() {
  const [content, setContent] = React.useState('Loading...')
  
  React.useEffect(() => {
    const timer = setTimeout(() => setContent('Dynamic content loaded!'), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Dynamic Page</h1>
        <div id="dynamic-content">{content}</div>
        <form method="POST" action="/dynamic">
          <input type="text" name="test" placeholder="Test input" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Wait JS page component (used 10 times in tests)
function FormWaitJsPage() {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.__waitJs = true
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for JS</h1>
        <div>Waiting for JavaScript variable...</div>
      </body>
    </html>
  )
}

// Form Right Click page component (used 9 times in tests)
function FormRightClickPage() {
  const [message, setMessage] = React.useState('')
  
  const handleRightClick = (e) => {
    e.preventDefault()
    setMessage('Right clicked!')
  }

  return (
    <html>
      <body>
        <h1>Right Click Test</h1>
        <div id="rightclick" onContextMenu={handleRightClick}>
          Right click me!
        </div>
        <div id="message">{message}</div>
      </body>
    </html>
  )
}

// Form Wait Clickable page component (used 8 times in tests)  
function FormWaitClickablePage() {
  const [clickable, setClickable] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setClickable(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Clickable</h1>
        <button id="button" disabled={!clickable} onClick={() => alert('Clicked!')}>
          {clickable ? 'Click me!' : 'Wait...'}
        </button>
      </body>
    </html>
  )
}

// Form Resize page component (used 8 times in tests)
function FormResizePage() {
  const [size, setSize] = React.useState({ width: '100px', height: '50px' })
  
  const resize = () => {
    setSize({ width: '200px', height: '100px' })
  }

  return (
    <html>
      <body>
        <h1>Resize Test</h1>
        <div id="resizable" style={{ width: size.width, height: size.height, border: '1px solid black' }}>
          Resizable element
        </div>
        <button onClick={resize}>Resize</button>
      </body>
    </html>
  )
}

// Form Hover page component (used 8 times in tests)
function FormHoverPage() {
  const [message, setMessage] = React.useState('')
  
  return (
    <html>
      <body>
        <h1>Hover Test</h1>
        <div 
          id="hover" 
          onMouseEnter={() => setMessage('Hovered!')}
          onMouseLeave={() => setMessage('')}
        >
          Hover over me!
        </div>
        <div id="message">{message}</div>
      </body>
    </html>
  )
}

// Form Empty page component (used 8 times in tests)
function FormEmptyPage() {
  return (
    <html>
      <body>
        <h1>Empty Form</h1>
        <form method="POST" action="/form/complex">
          <input type="text" name="empty" placeholder="Empty field" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Basic Auth page component (used 6 times in tests)
function BasicAuthPage() {
  return (
    <html>
      <body>
        <h1>Basic Auth Required</h1>
        <p>This page requires basic authentication.</p>
        <p>Username: admin, Password: password</p>
      </body>
    </html>
  )
}

// Form Focus Blur Elements page component (used 5 times in tests)
function FormFocusBlurElementsPage() {
  const [focusMsg, setFocusMsg] = React.useState('')
  
  return (
    <html>
      <body>
        <h1>Focus and Blur Test</h1>
        <input 
          type="text" 
          id="focus-input"
          name="test"
          onFocus={() => setFocusMsg('Focused!')}
          onBlur={() => setFocusMsg('Blurred!')}
          placeholder="Focus on me"
        />
        <div id="focus-message">{focusMsg}</div>
      </body>
    </html>
  )
}

// Form Example4 page component (used 5 times in tests)
function FormExample4Page() {
  return (
    <html>
      <body>
        <h1>Example Form 4</h1>
        <form method="POST" action="/form/complex">
          <label>Example 4 Field:</label>
          <input type="text" name="example4" placeholder="Enter value" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Additional commonly used form routes

// Form Example2 page component
function FormExample2Page() {
  return (
    <html>
      <body>
        <h1>Example Form 2</h1>
        <form method="POST" action="/form/complex">
          <label>Example 2 Field:</label>
          <input type="text" name="example2" placeholder="Enter value" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Example3 page component
function FormExample3Page() {
  return (
    <html>
      <body>
        <h1>Example Form 3</h1>
        <form method="POST" action="/form/complex">
          <label>Example 3 Field:</label>
          <input type="text" name="example3" placeholder="Enter value" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Example5 through Example20 page components
function FormExample5Page() {
  return (
    <html>
      <body>
        <h1>Example Form 5</h1>
        <form method="POST" action="/form/complex">
          <label>Example 5 Field:</label>
          <input type="text" name="example5" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Radio page component
function FormRadioPage() {
  return (
    <html>
      <body>
        <h1>Radio Button Test</h1>
        <form method="POST" action="/form/complex">
          <p>Choose an option:</p>
          <label><input type="radio" name="choice" value="option1" /> Option 1</label><br />
          <label><input type="radio" name="choice" value="option2" /> Option 2</label><br />
          <label><input type="radio" name="choice" value="option3" /> Option 3</label><br />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Image page component  
function FormImagePage() {
  return (
    <html>
      <body>
        <h1>Image Test</h1>
        <img id="image1" src="/codeceptjs.png" alt="Test image" />
        <input type="image" src="/codeceptjs.png" alt="Submit" name="image-button" />
        <form method="POST" action="/form/complex">
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Double Click page component
function FormDoubleClickPage() {
  const [message, setMessage] = React.useState('')
  
  const handleDoubleClick = () => {
    setMessage('Double clicked!')
  }

  return (
    <html>
      <body>
        <h1>Double Click Test</h1>
        <button id="dblclick-button" onDoubleClick={handleDoubleClick}>
          Double click me!
        </button>
        <div id="message">{message}</div>
      </body>
    </html>
  )
}

// Form Wait Visible page component
function FormWaitVisiblePage() {
  const [visible, setVisible] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Visible</h1>
        {visible && <div id="visible-element">Now I'm visible!</div>}
      </body>
    </html>
  )
}

// Form Scroll page component
function FormScrollPage() {
  return (
    <html>
      <body style={{ height: '3000px' }}>
        <h1>Scroll Test</h1>
        <div style={{ marginTop: '1000px' }}>
          <div id="scroll-target">Scroll target element</div>
        </div>
        <div style={{ marginTop: '1000px' }}>
          <form method="POST" action="/form/complex">
            <input type="text" name="scroll-field" placeholder="Scroll field" />
            <input type="submit" value="Submit" />
          </form>
        </div>
      </body>
    </html>
  )
}

// Form Select Multiple page component
function FormSelectMultiplePage() {
  return (
    <html>
      <body>
        <h1>Multiple Select Test</h1>
        <form method="POST" action="/form/complex">
          <label>Multiple Selection:</label>
          <select name="multiple[]" multiple size="5">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
            <option value="option4">Option 4</option>
            <option value="option5">Option 5</option>
          </select>
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Checkbox Array page component
function FormCheckboxArrayPage() {
  return (
    <html>
      <body>
        <h1>Checkbox Array Test</h1>
        <form method="POST" action="/form/complex">
          <p>Select multiple options:</p>
          <label><input type="checkbox" name="items[]" value="item1" /> Item 1</label><br />
          <label><input type="checkbox" name="items[]" value="item2" /> Item 2</label><br />
          <label><input type="checkbox" name="items[]" value="item3" /> Item 3</label><br />
          <label><input type="checkbox" name="items[]" value="item4" /> Item 4</label><br />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Wait Num Elements page component
function FormWaitNumElementsPage() {
  const [elements, setElements] = React.useState([])
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setElements([1, 2, 3])
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Number of Elements</h1>
        <div>
          {elements.map((el, index) => (
            <div key={index} className="element">Element {el}</div>
          ))}
        </div>
      </body>
    </html>
  )
}

// Form Wait Detached page component
function FormWaitDetachedPage() {
  const [attached, setAttached] = React.useState(true)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setAttached(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Detached</h1>
        {attached && <div id="detached-element">This will be detached</div>}
      </body>
    </html>
  )
}

// Form Wait Disabled page component  
function FormWaitDisabledPage() {
  const [disabled, setDisabled] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setDisabled(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <html>
      <body>
        <h1>Wait for Disabled</h1>
        <button id="button" disabled={disabled}>
          {disabled ? 'Disabled' : 'Enabled'}
        </button>
      </body>
    </html>
  )
}

// Additional bug forms for tests
function FormBug1535Page() {
  return (
    <html>
      <body>
        <h1>Bug 1535 Form</h1>
        <form method="POST" action="/form/complex">
          <input type="text" name="bug1535" placeholder="Bug 1535 test" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

function FormBug1585Page() {
  return (
    <html>
      <body>
        <h1>Bug 1585 Form</h1>
        <form method="POST" action="/form/complex">
          <input type="text" name="bug1585" placeholder="Bug 1585 test" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

function FormBug1598Page() {
  return (
    <html>
      <body>
        <h1>Bug 1598 Form</h1>
        <form method="POST" action="/form/complex">
          <input type="text" name="bug1598" placeholder="Bug 1598 test" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

function FormBug1637Page() {
  return (
    <html>
      <body>
        <h1>Bug 1637 Form</h1>
        <form method="POST" action="/form/complex">
          <input type="text" name="bug1637" placeholder="Bug 1637 test" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Additional critical form routes

// Form Download page component
function FormDownloadPage() {
  return (
    <html>
      <body>
        <h1>Download Test</h1>
        <a href="/download" id="download-link">Download File</a>
        <form method="POST" action="/form/complex">
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Submit Multiple page component
function FormSubmitMultiplePage() {
  return (
    <html>
      <body>
        <h1>Submit Multiple Forms</h1>
        <form method="POST" action="/form/complex" id="form1">
          <input type="text" name="field1" placeholder="Form 1 field" />
          <input type="submit" value="Submit Form 1" />
        </form>
        <form method="POST" action="/form/complex" id="form2">
          <input type="text" name="field2" placeholder="Form 2 field" />
          <input type="submit" value="Submit Form 2" />
        </form>
      </body>
    </html>
  )
}

// Form Content Editable page component
function FormContentEditablePage() {
  return (
    <html>
      <body>
        <h1>Content Editable Test</h1>
        <div id="editor" contentEditable="true" style={{ border: '1px solid #ccc', padding: '10px', minHeight: '100px' }}>
          Edit this content
        </div>
        <form method="POST" action="/form/complex">
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Names with Square Brackets page component
function FormNamesSquareBracketsPage() {
  return (
    <html>
      <body>
        <h1>Names with Square Brackets</h1>
        <form method="POST" action="/form/complex">
          <input type="text" name="user[name]" placeholder="Name" />
          <input type="text" name="user[email]" placeholder="Email" />
          <input type="text" name="items[]" placeholder="Item 1" />
          <input type="text" name="items[]" placeholder="Item 2" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Unchecked page component
function FormUncheckedPage() {
  return (
    <html>
      <body>
        <h1>Unchecked Elements Test</h1>
        <form method="POST" action="/form/complex">
          <label><input type="checkbox" name="check1" value="1" /> Checkbox 1</label><br />
          <label><input type="checkbox" name="check2" value="2" /> Checkbox 2</label><br />
          <label><input type="radio" name="radio" value="r1" /> Radio 1</label><br />
          <label><input type="radio" name="radio" value="r2" /> Radio 2</label><br />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Select OnChange page component
function FormSelectOnChangePage() {
  const [selected, setSelected] = React.useState('')
  const [message, setMessage] = React.useState('')
  
  const handleChange = (e) => {
    setSelected(e.target.value)
    setMessage(`Selected: ${e.target.value}`)
  }

  return (
    <html>
      <body>
        <h1>Select OnChange Test</h1>
        <form method="POST" action="/form/complex">
          <select name="selection" onChange={handleChange} value={selected}>
            <option value="">Choose...</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
          <div id="change-message">{message}</div>
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Fetch Call page component
function FormFetchCallPage() {
  const [result, setResult] = React.useState('')
  
  const makeCall = async () => {
    try {
      const response = await fetch('/info')
      setResult('Fetch call completed')
    } catch (error) {
      setResult('Fetch call failed')
    }
  }

  return (
    <html>
      <body>
        <h1>Fetch Call Test</h1>
        <button onClick={makeCall}>Make Fetch Call</button>
        <div id="fetch-result">{result}</div>
        <form method="POST" action="/form/complex">
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Page Slider component
function FormPageSliderPage() {
  const [value, setValue] = React.useState(50)

  return (
    <html>
      <body>
        <h1>Page Slider Test</h1>
        <form method="POST" action="/form/complex">
          <input 
            type="range" 
            id="slider" 
            name="slider" 
            min="0" 
            max="100" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div>Value: {value}</div>
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  )
}

// Form Scroll Into View page component
function FormScrollIntoViewPage() {
  const scrollToElement = () => {
    const element = document.getElementById('scroll-target')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <html>
      <body style={{ height: '3000px' }}>
        <h1>Scroll Into View Test</h1>
        <button onClick={scrollToElement}>Scroll to Target</button>
        <div style={{ marginTop: '2000px' }}>
          <div id="scroll-target" style={{ backgroundColor: 'yellow', padding: '20px' }}>
            Target element
          </div>
          <form method="POST" action="/form/complex">
            <input type="text" name="scroll-field" placeholder="Field after scroll" />
            <input type="submit" value="Submit" />
          </form>
        </div>
      </body>
    </html>
  )
}

// Invisible Elements page component
function InvisibleElementsPage() {
  return (
    <html>
      <body>
        <h1>Invisible Elements Test</h1>
        <div style={{ display: 'none' }} id="invisible-div">Invisible div</div>
        <div style={{ visibility: 'hidden' }} id="hidden-div">Hidden div</div>
        <div style={{ opacity: 0 }} id="transparent-div">Transparent div</div>
        <div id="visible-div">Visible div</div>
        <form method="POST" action="/form/complex">
          <input type="submit" value="Submit" />
        </form>
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
        <Route path="/form/example4" element={<FormExample4Page />} />
        <Route path="/form/example7" element={<FormExample7Page />} />
        <Route path="/form/wait_element" element={<FormWaitElementPage />} />
        <Route path="/form/custom_locator_strategies" element={<CustomLocatorStrategiesPage />} />
        <Route path="/form/bug1467" element={<FormBug1467Page />} />
        <Route path="/form/complex" element={<FormComplexPage />} />
        {/* Most frequently used missing routes from helper tests */}
        <Route path="/form/field_values" element={<FormFieldValuesPage />} />
        <Route path="/form/wait_for_clickable" element={<FormWaitForClickablePage />} />
        <Route path="/form/popup" element={<FormPopupPage />} />
        <Route path="/form/wait_value" element={<FormWaitValuePage />} />
        <Route path="/form/wait_invisible" element={<FormWaitInvisiblePage />} />
        <Route path="/form/wait_enabled" element={<FormWaitEnabledPage />} />
        <Route path="/form/wait_js" element={<FormWaitJsPage />} />
        <Route path="/form/rightclick" element={<FormRightClickPage />} />
        <Route path="/form/wait_clickable" element={<FormWaitClickablePage />} />
        <Route path="/form/resize" element={<FormResizePage />} />
        <Route path="/form/hover" element={<FormHoverPage />} />
        <Route path="/form/empty" element={<FormEmptyPage />} />
        <Route path="/form/focus_blur_elements" element={<FormFocusBlurElementsPage />} />
        <Route path="/dynamic" element={<DynamicPage />} />
        <Route path="/basic_auth" element={<BasicAuthPage />} />
        {/* Additional form routes */}
        <Route path="/form/example2" element={<FormExample2Page />} />
        <Route path="/form/example3" element={<FormExample3Page />} />
        <Route path="/form/example5" element={<FormExample5Page />} />
        <Route path="/form/radio" element={<FormRadioPage />} />
        <Route path="/form/image" element={<FormImagePage />} />
        <Route path="/form/doubleclick" element={<FormDoubleClickPage />} />
        <Route path="/form/wait_visible" element={<FormWaitVisiblePage />} />
        <Route path="/form/scroll" element={<FormScrollPage />} />
        <Route path="/form/select_multiple" element={<FormSelectMultiplePage />} />
        <Route path="/form/checkbox_array" element={<FormCheckboxArrayPage />} />
        <Route path="/form/wait_num_elements" element={<FormWaitNumElementsPage />} />
        <Route path="/form/wait_detached" element={<FormWaitDetachedPage />} />
        <Route path="/form/wait_disabled" element={<FormWaitDisabledPage />} />
        <Route path="/form/bug1535" element={<FormBug1535Page />} />
        <Route path="/form/bug1585" element={<FormBug1585Page />} />
        <Route path="/form/bug1598" element={<FormBug1598Page />} />
        <Route path="/form/bug1637" element={<FormBug1637Page />} />
        {/* Additional critical form routes */}
        <Route path="/form/download" element={<FormDownloadPage />} />
        <Route path="/form/submitform_multiple" element={<FormSubmitMultiplePage />} />
        <Route path="/form/contenteditable" element={<FormContentEditablePage />} />
        <Route path="/form/names-sq-brackets" element={<FormNamesSquareBracketsPage />} />
        <Route path="/form/unchecked" element={<FormUncheckedPage />} />
        <Route path="/form/select_onchange" element={<FormSelectOnChangePage />} />
        <Route path="/form/fetch_call" element={<FormFetchCallPage />} />
        <Route path="/form/page_slider" element={<FormPageSliderPage />} />
        <Route path="/form/scroll_into_view" element={<FormScrollIntoViewPage />} />
        {/* Special non-form pages */}
        <Route path="/invisible_elements" element={<InvisibleElementsPage />} />
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
