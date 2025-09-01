Feature('Cypress Helper Comprehensive Tests')

Scenario('Basic navigation and assertions @Cypress', ({ I }) => {
  I.amOnPage('/')
  I.seeInTitle('Test')
  I.seeInCurrentUrl('/')
  I.dontSeeInCurrentUrl('/login')
  I.see('Welcome')
  I.dontSee('Error message')
})

Scenario('Element interactions and waiting @Cypress', ({ I }) => {
  I.amOnPage('/form/example1')
  I.waitForElement('#form', 5)
  I.seeElement('#name-field')
  I.dontSeeElement('#hidden-field')
  I.fillField('Name', 'John Doe')
  I.fillField('Email', 'john@example.com')
  I.appendField('Comments', ' - Additional notes')
  I.selectOption('Country', 'United States')
  I.click('Submit')
  I.waitForText('Thank you', 3)
})

Scenario('Advanced form handling @Cypress', ({ I }) => {
  I.amOnPage('/form/complex')
  I.fillField('#username', 'testuser')
  I.clearField('#username')
  I.fillField('#username', 'correcteduser')
  I.fillField('#password', 'testpass')
  I.doubleClick('#agree-checkbox')
  I.selectOption('#role', 'admin')
  I.click('Submit')
  I.see('User created successfully')
})

Scenario('Page operations @Cypress', ({ I }) => {
  I.amOnPage('/')
  I.see('Initial content')
  I.refreshPage()
  I.see('Initial content') // Should still be there after refresh
  I.saveScreenshot('homepage.png')
})

Scenario('URL and title checks @Cypress', ({ I }) => {
  I.amOnPage('/about')
  I.seeInTitle('About')
  I.dontSeeInTitle('Error')
  const title = I.grabTitle()
  I.seeInCurrentUrl('/about')
  I.dontSeeInCurrentUrl('/contact')
  const url = I.grabCurrentUrl()
})

Scenario('Using Cypress API directly @Cypress', ({ I }) => {
  I.amOnPage('/')

  I.useCypressTo('setup network interception', ({ cy }) => {
    cy.intercept('GET', '/api/users', { fixture: 'users.json' })
    cy.intercept('POST', '/api/login', { statusCode: 200, body: { success: true } })
  })

  I.useCypressTo('perform custom assertions', ({ cy }) => {
    cy.get('body').should('be.visible')
    cy.get('[data-cy=submit]').should('exist')
  })

  I.useCypressTo('handle complex interactions', ({ cy }) => {
    cy.get('#dropdown').click()
    cy.contains('Option 1').click()
  })
})

Scenario('Mixed CodeceptJS and Cypress commands @Cypress', ({ I }) => {
  I.amOnPage('/dashboard')
  I.see('Dashboard')

  // Use CodeceptJS for simple operations
  I.fillField('#search', 'test query')
  I.click('#search-btn')

  // Use Cypress for advanced operations
  I.useCypressTo('validate search results', ({ cy }) => {
    cy.get('.search-results').should('have.length.greaterThan', 0)
    cy.get('.search-results').first().should('contain', 'test query')
  })

  // Back to CodeceptJS
  I.see('Search results')
  I.dontSee('No results found')
})

Scenario('Error handling and recovery @Cypress', ({ I }) => {
  I.amOnPage('/error-prone-page')
  I.waitForElement('#content', 10)
  I.see('Content loaded')

  I.useCypressTo('handle potential errors gracefully', ({ cy }) => {
    cy.get('#potentially-missing').should('not.exist')
  })

  I.click('#refresh-content')
  I.waitForText('Refreshed content', 5)
})
