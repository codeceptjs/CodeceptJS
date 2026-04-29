import fs from 'fs'
import { fileURLToPath } from 'url'

let resqScript

async function findReact(matcher, locator) {
  const reactLocator = locator.locator || locator
  const page = typeof matcher.page === 'function' ? matcher.page() : matcher

  if (!resqScript) {
    resqScript = fs.readFileSync(fileURLToPath(import.meta.resolve('resq'))).toString()
  }
  await page.evaluate(resqScript)
  await page.evaluate(() => window.resq.waitToLoadReact())

  const arrayHandle = await page.evaluateHandle(
    ({ selector, props, state }) => {
      let elements = window.resq.resq$$(selector)
      if (Object.keys(props).length) elements = elements.byProps(props)
      if (Object.keys(state).length) elements = elements.byState(state)
      if (!elements.length) return []

      let nodes = []
      elements.forEach(element => {
        let { node, isFragment } = element
        if (!node) {
          isFragment = true
          node = element.children
        }
        if (isFragment) nodes = nodes.concat(node)
        else nodes.push(node)
      })
      return [...nodes]
    },
    {
      selector: reactLocator.react,
      props: reactLocator.props || {},
      state: reactLocator.state || {},
    },
  )

  const properties = await arrayHandle.getProperties()
  await arrayHandle.dispose()
  const result = []
  for (const property of properties.values()) {
    const elementHandle = property.asElement()
    if (elementHandle) result.push(elementHandle)
  }
  return result
}

async function findByPlaywrightLocator(matcher, locator) {
  const pwLocator = locator.locator || locator
  if (pwLocator && pwLocator.toString && pwLocator.toString().includes(process.env.testIdAttribute)) {
    return matcher.getByTestId(pwLocator.pw.value.split('=')[1])
  }
  const pwValue = typeof pwLocator.pw === 'string' ? pwLocator.pw : pwLocator.pw
  return matcher.locator(pwValue).all()
}

export { findReact, findByPlaywrightLocator }
