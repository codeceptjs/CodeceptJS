import Locator from '../../locator.js'

function buildLocatorString(locator) {
  if (locator.isCustom()) {
    return `${locator.type}=${locator.value}`
  }
  if (locator.isXPath()) {
    return `xpath=${locator.value}`
  }
  return locator.simplify()
}

async function findElements(matcher, locator) {
  const matchedLocator = new Locator(locator, 'css')

  if (matchedLocator.type === 'react') return findReact(matcher, matchedLocator)
  if (matchedLocator.type === 'vue') return findVue(matcher, matchedLocator)
  if (matchedLocator.type === 'pw') return findByPlaywrightLocator(matcher, matchedLocator)
  if (matchedLocator.isRole()) return findByRole(matcher, matchedLocator)

  return matcher.locator(buildLocatorString(matchedLocator)).all()
}

async function findElement(matcher, locator) {
  const matchedLocator = new Locator(locator, 'css')

  if (matchedLocator.type === 'react') return findReact(matcher, matchedLocator)
  if (matchedLocator.type === 'vue') return findVue(matcher, matchedLocator)
  if (matchedLocator.type === 'pw') return findByPlaywrightLocator(matcher, matchedLocator, { first: true })
  if (matchedLocator.isRole()) return findByRole(matcher, matchedLocator, { first: true })

  return matcher.locator(buildLocatorString(matchedLocator)).first()
}

async function getVisibleElements(elements) {
  const visibleElements = []
  for (const element of elements) {
    if (await element.isVisible()) {
      visibleElements.push(element)
    }
  }
  if (visibleElements.length === 0) {
    return elements
  }
  return visibleElements
}

async function findReact(matcher, locator) {
  const details = locator.locator ?? { react: locator.value }
  let locatorString = `_react=${details.react}`

  if (details.props) {
    locatorString += propBuilder(details.props)
  }

  return matcher.locator(locatorString).all()
}

async function findVue(matcher, locator) {
  const details = locator.locator ?? { vue: locator.value }
  let locatorString = `_vue=${details.vue}`

  if (details.props) {
    locatorString += propBuilder(details.props)
  }

  return matcher.locator(locatorString).all()
}

async function findByPlaywrightLocator(matcher, locator, { first = false } = {}) {
  const details = locator.locator ?? { pw: locator.value }
  const locatorValue = details.pw

  const handle = matcher.locator(locatorValue)
  return first ? handle.first() : handle.all()
}

async function findByRole(matcher, locator, { first = false } = {}) {
  const details = locator.locator ?? { role: locator.value }
  const { role, text, name, exact, includeHidden, ...rest } = details
  const options = { ...rest }

  if (includeHidden !== undefined) options.includeHidden = includeHidden

  const accessibleName = name ?? text
  if (accessibleName !== undefined) {
    options.name = accessibleName
    if (exact === true) options.exact = true
  }

  const roleLocator = matcher.getByRole(role, options)
  return first ? roleLocator.first() : roleLocator.all()
}

function propBuilder(props) {
  let _props = ''

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        _props += `[${key}.${k} = "${v}"]`
      }
    } else {
      _props += `[${key} = "${value}"]`
    }
  }
  return _props
}

export { buildLocatorString, findElements, findElement, getVisibleElements, findReact, findVue, findByPlaywrightLocator, findByRole }
