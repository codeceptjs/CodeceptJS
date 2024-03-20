async function findReact(matcher, locator) {
  let _locator = `_react=${locator.react}`;
  let props = '';

  if (locator.props) {
    props += propBuilder(locator.props);
    _locator += props;
  }
  return matcher.locator(_locator).all();
}

async function findVue(matcher, locator) {
  let _locator = `_vue=${locator.vue}`;
  let props = '';

  if (locator.props) {
    props += propBuilder(locator.props);
    _locator += props;
  }
  return matcher.locator(_locator).all();
}

async function findByPlaywrightLocator(matcher, locator) {
  if (locator && locator.toString().includes(process.env.testIdAttribute)) return matcher.getByTestId(locator.pw.value.split('=')[1]);
  return matcher.locator(locator.pw).all();
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

module.exports = { findReact, findVue, findByPlaywrightLocator };
