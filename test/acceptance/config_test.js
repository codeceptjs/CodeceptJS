Feature('Dynamic Config').config({ url: 'https://google.com' })

Scenario('change config 1 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.dontSeeInCurrentUrl('github.com')
  I.seeInCurrentUrl('google.com')
})

Scenario('change config 2 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.seeInCurrentUrl('codecept.io')
}).config({ url: 'https://codecept.io' })

Scenario('change config 3 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.dontSeeInCurrentUrl('codecept.io')
  I.seeInCurrentUrl('google.com')
})

Scenario('change config 4 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.seeInCurrentUrl('codecept.io')
}).config(test => {
  return { url: 'https://codecept.io/', capabilities: { 'moz:title': test.title } }
})

Scenario('change config 5 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.dontSeeInCurrentUrl('codecept.io')
  I.seeInCurrentUrl('google.com')
})

Scenario('make API call and check response @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.makeApiRequest('get', 'http://127.0.0.1:8010/posts/1')
  I.seeResponseCodeIsSuccessful()
})

Scenario('change config 6 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/')
  I.seeInCurrentUrl('codecept.io')
}).config({ url: 'https://codecept.io' })

Scenario('simple page test @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('https://github.com')
  I.see('GitHub')
})
