import playwright from 'playwright'

const createValueEngine = () => ({
  query(root, selector) {
    return root.querySelector(`[value="${selector}"]`)
  },
  queryAll(root, selector) {
    return Array.from(root.querySelectorAll(`[value="${selector}"]`))
  },
})

async function test() {
  console.log('Registering selector...')
  await playwright.selectors.register('__value', createValueEngine)
  console.log('Selector registered successfully')

  console.log('Launching browser...')
  const browser = await playwright.chromium.launch()
  console.log('Browser launched')

  console.log('Creating first context...')
  const context1 = await browser.newContext()
  console.log('First context created')

  console.log('Creating second context...')
  const context2 = await browser.newContext()
  console.log('Second context created')

  console.log('Trying to register selector again...')
  try {
    await playwright.selectors.register('__value', createValueEngine)
    console.log('Selector re-registered (should not happen)')
  } catch (e) {
    console.log('Error re-registering selector:', e.message)
  }

  await context1.close()
  await context2.close()
  await browser.close()
  console.log('Test complete')
}

test().catch(console.error)
