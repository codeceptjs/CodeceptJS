const { I } = inject()

Feature('React Selectors')

Scenario('props @Puppeteer @Playwright', () => {
    I.amOnPage('https://codecept.io/test-react-calculator/')
    I.click('7')
    I.click({ react: 't', props: { name: '=' } })
    I.seeElement({ react: 't', props: { value: '7' } })
    I.click({ react: 't', props: { name: '+' } })
    I.click({ react: 't', props: { name: '3' } })
    I.click({ react: 't', props: { name: '=' } })
    I.seeElement({ react: 't', props: { value: '10' } })
})

Scenario('component name @Puppeteer @Playwright', () => {
    I.amOnPage('http://negomi.github.io/react-burger-menu/')
    I.click({ react: 'BurgerIcon' })
    I.waitForVisible('#slide', 10)
    I.click('Alerts')
    I.seeElement({ react: 'Demo' })
})

Scenario('using playwright locator @Playwright', () => {
    I.amOnPage('https://codecept.io/test-react-calculator/')
    I.click('7')
    I.click({ pw: '_react=t[name = "="]' })
    I.seeElement({ pw: '_react=t[value = "7"]' })
    I.click({ pw: '_react=t[name = "+"]' })
    I.click({ pw: '_react=t[name = "3"]' })
    I.click({ pw: '_react=t[name = "="]' })
    I.seeElement({ pw: '_react=t[value = "10"]' })
})
