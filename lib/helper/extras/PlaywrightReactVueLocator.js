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
  let _locator = `_vue=${locator.react}`;
  let props = '';

  if (locator.props) {
    props += propBuilder(locator.props);
    _locator += props;
  }
  return matcher.locator(_locator).all();
}

function propBuilder(props) {
  let _props = '';

  for (const [key, value] of Object.entries(props)) {
    _props += `[${key} = "${value}"]`;
  }
  return _props;
}

module.exports = { findReact, findVue };
