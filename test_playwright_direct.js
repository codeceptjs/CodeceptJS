import Playwright from './lib/helper/Playwright.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testPlaywrightInit() {
  console.log('Creating Playwright instance...')
  const I = new Playwright({
    url: 'http://127.0.0.1:8000',
    browser: 'chromium',
    show: false,
    waitForTimeout: 5000,
    timeout: 2000,
    restart: false,
    manualStart: false,
    chrome: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  })

  try {
    console.log('Calling _init()...')
    await I._init()
    console.log('_init() completed')

    console.log('Calling _beforeSuite()...')
    await I._beforeSuite()
    console.log('_beforeSuite() completed')

    console.log('Calling _before()...')
    await I._before()
    console.log('_before() completed')

    console.log('Navigating to page...')
    await I.amOnPage('/')
    console.log('Navigation completed')

    console.log('Cleaning up - calling _after()...')
    await I._after()
    console.log('_after() completed')
    
    console.log('Calling _afterSuite()...')
    await I._afterSuite()
    console.log('_afterSuite() completed')
    
    console.log('Calling _cleanup()...')
    await I._cleanup()
    console.log('_cleanup() completed')

    console.log('✅ All operations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('❌ Test timed out after 30 seconds')
  process.exit(1)
}, 30000)

testPlaywrightInit().finally(() => clearTimeout(timeout))
