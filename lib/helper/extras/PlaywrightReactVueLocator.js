async function findReact(matcher, locator) {
  // Handle both Locator objects and raw locator objects
  const reactLocator = locator.locator || locator
  let _locator = `_react=${reactLocator.react}`;
  let props = '';

  if (reactLocator.props) {
    props += propBuilder(reactLocator.props);
    _locator += props;
  }
  return matcher.locator(_locator).all();
}

async function findVue(matcher, locator) {
  // Handle both Locator objects and raw locator objects
  const vueLocator = locator.locator || locator
  let _locator = `_vue=${vueLocator.vue}`;
  let props = '';

  if (vueLocator.props) {
    props += propBuilder(vueLocator.props);
    _locator += props;
  }
  return matcher.locator(_locator).all();
}

async function findByPlaywrightLocator(matcher, locator) {
  // Handle both Locator objects and raw locator objects
  const pwLocator = locator.locator || locator
  if (pwLocator && pwLocator.toString && pwLocator.toString().includes(process.env.testIdAttribute)) {
    return matcher.getByTestId(pwLocator.pw.value.split('=')[1]);
  }
  const pwValue = typeof pwLocator.pw === 'string' ? pwLocator.pw : pwLocator.pw
  return matcher.locator(pwValue).all();
}

function propBuilder(props) {
  let _props = '';

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        _props += `[${key}.${k} = "${v}"]`;
      }
    } else {
      _props += `[${key} = "${value}"]`;
    }
  }
  return _props;
}

export { findReact, findVue, findByPlaywrightLocator };
