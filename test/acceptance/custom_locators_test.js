Feature('Custom Locator Strategies - @Playwright')

Before(I => {
  // Create test HTML with various attributes for custom locator testing
  I.amOnPage('/form/empty')
  I.executeScript(() => {
    document.body.innerHTML = `
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
    `
  })
})

Scenario('should find elements using byRole custom locator', I => {
  I.see('Custom Locator Test Page', { byRole: 'main' })
  I.seeElement({ byRole: 'form' })
  I.seeElement({ byRole: 'button' })
  I.seeElement({ byRole: 'navigation' })
  I.seeElement({ byRole: 'complementary' })
})

Scenario('should find elements using byTestId custom locator', I => {
  I.see('Custom Locator Test Page', { byTestId: 'page-title' })
  I.seeElement({ byTestId: 'username-input' })
  I.seeElement({ byTestId: 'password-input' })
  I.seeElement({ byTestId: 'submit-button' })
  I.seeElement({ byTestId: 'cancel-button' })
  I.seeElement({ byTestId: 'info-text' })
})

Scenario('should find elements using byDataQa custom locator', I => {
  I.seeElement({ byDataQa: 'test-form' })
  I.seeElement({ byDataQa: 'form-section' })
  I.seeElement({ byDataQa: 'submit-btn' })
  I.seeElement({ byDataQa: 'cancel-btn' })
  I.seeElement({ byDataQa: 'info-section' })
  I.seeElement({ byDataQa: 'nav-section' })
})

Scenario('should find elements using byAriaLabel custom locator', I => {
  I.see('Custom Locator Test Page', { byAriaLabel: 'Welcome Message' })
  I.seeElement({ byAriaLabel: 'Username field' })
  I.seeElement({ byAriaLabel: 'Password field' })
  I.seeElement({ byAriaLabel: 'Submit form' })
  I.seeElement({ byAriaLabel: 'Cancel form' })
  I.seeElement({ byAriaLabel: 'Information message' })
})

Scenario('should find elements using byPlaceholder custom locator', I => {
  I.seeElement({ byPlaceholder: 'Enter your username' })
  I.seeElement({ byPlaceholder: 'Enter your password' })
})

Scenario('should interact with elements using custom locators', I => {
  I.fillField({ byTestId: 'username-input' }, 'testuser')
  I.fillField({ byPlaceholder: 'Enter your password' }, 'password123')

  I.seeInField({ byTestId: 'username-input' }, 'testuser')
  I.seeInField({ byAriaLabel: 'Password field' }, 'password123')

  I.click({ byDataQa: 'submit-btn' })
  // Form submission would normally happen here
})

Scenario('should handle multiple elements with byDataQa locator', I => {
  // byDataQa returns all matching elements, but interactions use the first one
  I.seeElement({ byDataQa: 'form-section' })

  // Should be able to see both form sections exist
  I.executeScript(() => {
    const sections = document.querySelectorAll('[data-qa="form-section"]')
    if (sections.length !== 2) {
      throw new Error(`Expected 2 form sections, found ${sections.length}`)
    }
  })
})

Scenario('should work with complex selectors and mixed locator types', I => {
  // Test that custom locators work alongside standard ones
  within({ byRole: 'form' }, () => {
    I.seeElement({ byTestId: 'username-input' })
    I.seeElement('input[name="password"]') // Standard CSS selector
    I.seeElement({ xpath: '//button[@type="submit"]' }) // Standard XPath
  })

  within({ byDataQa: 'nav-section' }, () => {
    I.seeElement({ byAriaLabel: 'Home link' })
    I.seeElement({ byAriaLabel: 'About link' })
    I.seeElement({ byAriaLabel: 'Contact link' })
  })
})

Scenario('should fail gracefully for non-existent custom locators', I => {
  // This should throw an error about undefined custom locator strategy
  try {
    I.seeElement({ byCustomUndefined: 'test' })
    throw new Error('Should have thrown an error for undefined custom locator')
  } catch (error) {
    if (!error.message.includes('Please define "customLocatorStrategies"')) {
      throw new Error('Wrong error message: ' + error.message)
    }
  }
})

Scenario('should work with grabbing methods', I => {
  const titleText = I.grabTextFrom({ byTestId: 'page-title' })
  I.assertEqual(titleText, 'Custom Locator Test Page')

  const usernameValue = I.grabValueFrom({ byAriaLabel: 'Username field' })
  I.assertEqual(usernameValue, '')

  I.fillField({ byPlaceholder: 'Enter your username' }, 'grabtest')
  const newUsernameValue = I.grabValueFrom({ byTestId: 'username-input' })
  I.assertEqual(newUsernameValue, 'grabtest')
})

Scenario('should work with waiting methods', I => {
  I.waitForElement({ byRole: 'main' }, 2)
  I.waitForVisible({ byTestId: 'submit-button' }, 2)
  I.waitForText('Custom Locator Test Page', 2, { byAriaLabel: 'Welcome Message' })
})
