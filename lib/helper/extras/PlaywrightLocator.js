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
  if (locator.react) return findReact(matcher, locator)
  if (locator.vue) return findVue(matcher, locator)
  if (locator.pw) return findByPlaywrightLocator.call(this, matcher, locator)
  if (locator.role) return findByRole(matcher, locator)
  locator = new Locator(locator, 'css')

  return matcher.locator(buildLocatorString(locator)).all()
}

async function findElement(matcher, locator) {
  if (locator.react) return findReact(matcher, locator)
  if (locator.vue) return findVue(matcher, locator)
  if (locator.pw) return findByPlaywrightLocator.call(this, matcher, locator)
  if (locator.role) return findByRole(matcher, locator)
  locator = new Locator(locator, 'css')

  return matcher.locator(buildLocatorString(locator)).first()
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
  let _locator = `_react=${locator.react}`
  let props = ''

  if (locator.props) {
    props += propBuilder(locator.props)
    _locator += props
  }
  return matcher.locator(_locator).all()
}

async function findVue(matcher, locator) {
  let _locator = `_vue=${locator.vue}`
  let props = ''

  if (locator.props) {
    props += propBuilder(locator.props)
    _locator += props
  }
  return matcher.locator(_locator).all()
}

async function findByPlaywrightLocator(matcher, locator) {
  if (locator && locator.toString().includes(process.env.testIdAttribute)) return matcher.getByTestId(locator.pw.value.split('=')[1])
  return matcher.locator(locator.pw).all()
}

async function findByRole(matcher, locator) {
  const role = locator.role

  if (!locator.text) {
    const roleOptions = {}
    if (locator.includeHidden !== undefined) roleOptions.includeHidden = locator.includeHidden
    return matcher.getByRole(role, roleOptions).all()
  }

  const allElements = await matcher.getByRole(role, locator.includeHidden !== undefined ? { includeHidden: locator.includeHidden } : {}).all()

  if (locator.exact === true) {
    const filtered = []
    for (const el of allElements) {
      const [accessibleName, placeholder, innerText] = await el.evaluate(element => {
        const getAccessibleName = () => {
          if (element.hasAttribute('aria-label')) {
            return element.getAttribute('aria-label')
          }
          if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`)
            if (label) return label.textContent.trim()
          }
          return ''
        }
        return [getAccessibleName(), element.getAttribute('placeholder') || '', element.innerText ? element.innerText.trim() : '']
      })

      if (accessibleName === locator.text || placeholder === locator.text || innerText === locator.text) {
        filtered.push(el)
      }
    }
    return filtered
  }

  const filtered = []
  for (const el of allElements) {
    const [accessibleName, placeholder, innerText] = await el.evaluate(element => {
      const getAccessibleName = () => {
        if (element.hasAttribute('aria-label')) {
          return element.getAttribute('aria-label')
        }
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`)
          if (label) return label.textContent.trim()
        }
        return ''
      }
      return [getAccessibleName(), element.getAttribute('placeholder') || '', element.innerText ? element.innerText.trim() : '']
    })

    if ((accessibleName && accessibleName.includes(locator.text)) || (placeholder && placeholder.includes(locator.text)) || (innerText && innerText.includes(locator.text))) {
      filtered.push(el)
    }
  }
  return filtered
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
