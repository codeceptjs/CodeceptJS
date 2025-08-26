const { I } = inject()

Feature('Custom Locator Strategies - @Playwright')

Before(() => {
  I.amOnPage('/form/custom_locator_strategies')
})

Scenario('should find elements using byRole custom locator', ({ I }) => {
  I.see('Custom Locator Test Page', { byRole: 'main' })
  I.seeElement({ byRole: 'form' })
  I.seeElement({ byRole: 'button' })
  I.seeElement({ byRole: 'navigation' })
  I.seeElement({ byRole: 'complementary' })
})

Scenario('should find elements using byTestId custom locator', ({ I }) => {
  I.see('Custom Locator Test Page', { byTestId: 'page-title' })
  I.seeElement({ byTestId: 'username-input' })
  I.seeElement({ byTestId: 'password-input' })
  I.seeElement({ byTestId: 'submit-button' })
  I.seeElement({ byTestId: 'cancel-button' })
  I.seeElement({ byTestId: 'info-text' })
})

Scenario('should find elements using byDataQa custom locator', ({ I }) => {
  I.seeElement({ byDataQa: 'test-form' })
  I.seeElement({ byDataQa: 'form-section' })
  I.seeElement({ byDataQa: 'submit-btn' })
  I.seeElement({ byDataQa: 'cancel-btn' })
  I.seeElement({ byDataQa: 'info-section' })
  I.seeElement({ byDataQa: 'nav-section' })
})

Scenario('should find elements using byAriaLabel custom locator', ({ I }) => {
  I.see('Custom Locator Test Page', { byAriaLabel: 'Welcome Message' })
  I.seeElement({ byAriaLabel: 'Username field' })
  I.seeElement({ byAriaLabel: 'Password field' })
  I.seeElement({ byAriaLabel: 'Submit form' })
  I.seeElement({ byAriaLabel: 'Cancel form' })
  I.seeElement({ byAriaLabel: 'Information message' })
})

Scenario('should find elements using byPlaceholder custom locator', ({ I }) => {
  I.seeElement({ byPlaceholder: 'Enter your username' })
  I.seeElement({ byPlaceholder: 'Enter your password' })
})

Scenario('should interact with elements using custom locators', ({ I }) => {
  I.fillField({ byTestId: 'username-input' }, 'testuser')
  I.fillField({ byPlaceholder: 'Enter your password' }, 'password123')

  I.seeInField({ byTestId: 'username-input' }, 'testuser')
  I.seeInField({ byAriaLabel: 'Password field' }, 'password123')

  I.click({ byDataQa: 'submit-btn' })
  // Form submission would normally happen here
})

Scenario('should handle multiple elements with byDataQa locator', ({ I }) => {
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

Scenario('should work with complex selectors and mixed locator types', ({ I }) => {
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

Scenario.skip('should fail gracefully for non-existent custom locators', async ({ I }) => {
  // This should throw an error about undefined custom locator strategy
  let errorThrown = false
  let errorMessage = ''

  try {
    await I.seeElement({ byCustomUndefined: 'test' })
  } catch (error) {
    errorThrown = true
    errorMessage = error.message
  }

  if (!errorThrown) {
    throw new Error('Should have thrown an error for undefined custom locator')
  }

  if (!errorMessage.includes('Please define "customLocatorStrategies"')) {
    throw new Error('Wrong error message: ' + errorMessage)
  }
})

Scenario('should work with grabbing methods', async ({ I }) => {
  const titleText = await I.grabTextFrom({ byTestId: 'page-title' })
  I.expectEqual(titleText, 'Custom Locator Test Page')

  const usernameValue = await I.grabValueFrom({ byAriaLabel: 'Username field' })
  I.expectEqual(usernameValue, '')

  I.fillField({ byPlaceholder: 'Enter your username' }, 'grabtest')
  const newUsernameValue = await I.grabValueFrom({ byTestId: 'username-input' })
  I.expectEqual(newUsernameValue, 'grabtest')
})

Scenario('should work with waiting methods', ({ I }) => {
  I.waitForElement({ byRole: 'main' }, 2)
  I.waitForVisible({ byTestId: 'submit-button' }, 2)
  I.waitForText('Custom Locator Test Page', 2, { byAriaLabel: 'Welcome Message' })
})
