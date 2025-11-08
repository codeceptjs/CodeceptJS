<html>
<body>
<div data-testid="main-container" role="main">
        <h1 data-testid="page-title" aria-label="Welcome Message">Custom Locator Test Page</h1>
        
        <form data-qa="test-form" role="form">
          <div data-qa="form-section">
            <label for="username">Username:</label>
            <input 
              id="username" 
              name="username" 
              data-testid="username-input"
              placeholder="Enter your username"
              aria-label="Username field"
            />
          </div>
          
          <div data-qa="form-section">
            <label for="password">Password:</label>
            <input 
              id="password" 
              name="password" 
              type="password"
              data-testid="password-input" 
              placeholder="Enter your password"
              aria-label="Password field"
            />
          </div>
          
          <button 
            type="submit" 
            data-testid="submit-button"
            data-qa="submit-btn"
            role="button"
            aria-label="Submit form"
          >
            Submit
          </button>
          
          <button 
            type="button" 
            data-testid="cancel-button"
            data-qa="cancel-btn"
            role="button"
            aria-label="Cancel form"
          >
            Cancel
          </button>
        </form>
        
        <div data-qa="info-section" role="complementary">
          <p data-testid="info-text" aria-label="Information message">
            This page tests custom locator strategies.
          </p>
        </div>
        
        <nav role="navigation" data-qa="nav-section">
          <ul>
            <li><a href="#" data-testid="nav-home" aria-label="Home link">Home</a></li>
            <li><a href="#" data-testid="nav-about" aria-label="About link">About</a></li>
            <li><a href="#" data-testid="nav-contact" aria-label="Contact link">Contact</a></li>
          </ul>
        </nav>
      </div>
</body>
</html>
