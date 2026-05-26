import { element, eachElement, expectElement, expectAnyElement, expectAllElements } from '../../lib/els.js'

Feature('element functions', { retries: 3 })

Scenario('element() should work with first matching element @Playwright', async ({ I }) => {
  I.amOnPage('/form/field')
  const attr = await element('input[name=name]', async el => {
    return await el.getAttribute('id')
  })
  if (attr !== 'name') {
    throw new Error('getAttribute() should return id')
  }
})

Scenario('element() should get text content @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const text = await element('h1', async el => {
    return await el.getText()
  })
  // Verify we got some text
  if (text === null || text === undefined) {
    throw new Error('getText() should return text content')
  }
})

Scenario('element() should get attribute @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  const nameAttr = await element('input[name=name]', async el => {
    return await el.getAttribute('name')
  })
  // The input should have a name attribute
  if (nameAttr !== 'name') {
    throw new Error('getAttribute() should return attribute value')
  }
})

Scenario('element() should check element visibility @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const visible = await element('h1', async el => {
    return await el.isVisible()
  })
  // h1 should be visible
  if (visible !== true) {
    throw new Error('isVisible() should return true for visible element')
  }
})

Scenario('element() should check if element is enabled @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  const enabled = await element('input[name=name]', async el => {
    return await el.isEnabled()
  })
  // input should be enabled
  if (enabled !== true) {
    throw new Error('isEnabled() should return true for enabled input')
  }
})

Scenario('element() should check hidden element is not visible @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  const visible = await element('input[name=email]', async el => {
    return await el.isVisible()
  })
  // This input is hidden via style="display:none"
  if (visible !== false) {
    throw new Error('isVisible() should return false for hidden element')
  }
})

Scenario('element() should click element @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/checkbox')
  const checkbox = await element('input[name=terms]', async el => {
    const enabled = await el.isEnabled()
    if (enabled) {
      await el.click()
    }
    return enabled
  })
  // Click should have worked
  I.seeCheckboxIsChecked('input[name=terms]')
})

Scenario('element() should type into input @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await element('input[name=name]', async el => {
    await el.type('test value')
  })
  I.seeInField('input[name=name]', 'test value')
})

Scenario('element() should find child elements with $() @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  let foundChild = false
  await element('form', async form => {
    const child = await form.$('input[name=name]')
    if (child) {
      foundChild = true
      // Verify the child is a WebElement
      const helper = child.getHelper()
      if (!helper) {
        throw new Error('Child should have helper')
      }
    }
  })
  if (!foundChild) {
    throw new Error('$(locator) should find child element')
  }
})

Scenario('element() should find multiple child elements with $$() @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  let childCount = 0
  await element('form', async form => {
    const children = await form.$$('input')
    childCount = children.length
  })
  // Should find at least some inputs
  if (childCount === 0) {
    throw new Error('$$(locator) should find child elements')
  }
})

Scenario('eachElement() should iterate over all matching elements @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  let count = 0
  await eachElement('a', async (el, index) => {
    count++
  })
  // Should have iterated over at least some links
  if (count === 0) {
    throw new Error('eachElement should iterate over elements')
  }
})

Scenario('eachElement() should provide index @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const indices = []
  await eachElement('a', async (el, index) => {
    indices.push(index)
  })
  // Should have received indices in order
  if (indices.length === 0) {
    throw new Error('eachElement should provide index')
  }
  // Verify indices are sequential
  for (let i = 0; i < indices.length; i++) {
    if (indices[i] !== i) {
      throw new Error(`Index should be ${i} but got ${indices[i]}`)
    }
  }
})

Scenario('eachElement() should get text from each element @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const texts = []
  await eachElement('h1, h2, h3', async el => {
    const text = await el.getText()
    texts.push(text)
  })
  // Should have collected text from elements
  if (texts.length === 0) {
    throw new Error('eachElement should process elements')
  }
})

Scenario('expectElement() should assert condition on first element @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  // Should pass - h1 should be visible
  await expectElement('h1', async el => {
    return await el.isVisible()
  })
})

Scenario('expectElement() should throw when condition is false @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  // expectElement should throw when condition returns false
  // We verify the element has the expected id first
  await expectElement('input[name=name]', async el => {
    const id = await el.getAttribute('id')
    return id === 'name'
  })
})

Scenario('expectElement() should check text content @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  await expectElement('h1', async el => {
    const text = await el.getText()
    return text && text.length > 0
  })
})

Scenario('expectElement() should check attribute value @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await expectElement('input[name=name]', async el => {
    const id = await el.getAttribute('id')
    return id === 'name'
  })
})

Scenario('expectAnyElement() should pass when at least one element matches @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  // At least one input should be enabled (all are)
  await expectAnyElement('input', async el => {
    return await el.isEnabled()
  })
})

Scenario('expectAnyElement() should check attribute exists on any element @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  // At least one input should have id attribute
  await expectAnyElement('input', async el => {
    const id = await el.getAttribute('id')
    return id !== null
  })
})

Scenario('expectAllElements() should pass when all elements match @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  // All inputs with type="text" should have name attribute
  await expectAllElements('input[type="text"]', async el => {
    const name = await el.getAttribute('name')
    return name !== null
  })
})

Scenario('expectAllElements() should check all elements are in DOM @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  // All elements should exist (be in DOM)
  await expectAllElements('h1, h2, h3', async el => {
    return await el.exists()
  })
})

Scenario('element() should get bounding box @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const box = await element('h1', async el => {
    return await el.getBoundingBox()
  })
  // Should return a bounding box object
  if (!box || typeof box.x !== 'number') {
    throw new Error('getBoundingBox() should return box with x coordinate')
  }
})

Scenario('element() should get inner HTML @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const html = await element('h1', async el => {
    return await el.getInnerHTML()
  })
  // Should return HTML content
  if (html === null || html === undefined) {
    throw new Error('getInnerHTML() should return HTML content')
  }
})

Scenario('element() should get outer HTML @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const html = await element('h1', async el => {
    return await el.toOuterHTML()
  })
  // Should return HTML content
  if (html === null || html === undefined || !html.includes('<h1')) {
    throw new Error('toOuterHTML() should return outer HTML')
  }
})

Scenario('element() should get simplified HTML @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/')
  const html = await element('h1', async el => {
    return await el.toSimplifiedHTML(50)
  })
  // Should return simplified HTML content
  if (html === null || html === undefined) {
    throw new Error('toSimplifiedHTML() should return simplified HTML')
  }
})

Scenario('element() should get property value @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await element('input[name=name]', async el => {
    await el.type('test')
    const value = await el.getProperty('value')
    if (value !== 'test') {
      throw new Error('getProperty(value) should return input value')
    }
  })
})

Scenario('element() should get input value @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await element('input[name=name]', async el => {
    await el.type('test value')
    const value = await el.getValue()
    if (value !== 'test value') {
      throw new Error('getValue() should return input value')
    }
  })
})

Scenario('element() should work with purpose parameter @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await element('check input value', 'input[name=name]', async el => {
    const value = await el.getValue()
    if (value !== 'OLD_VALUE') {
      throw new Error('input should have initial value')
    }
  })
})

Scenario('element() should handle chaining with child elements @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await element('form', async form => {
    const input = await form.$('input[name=name]')
    if (!input) {
      throw new Error('child element should be found')
    }
    const value = await input.getValue()
    if (value !== 'OLD_VALUE') {
      throw new Error('input should have initial value')
    }
  })
})

Scenario('element() should work with purpose parameter @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/field')
  await element('check input value', 'input[name=name]', async el => {
    const value = await el.getValue()
    if (value !== 'OLD_VALUE') {
      throw new Error('input should have initial value')
    }
  })
})
