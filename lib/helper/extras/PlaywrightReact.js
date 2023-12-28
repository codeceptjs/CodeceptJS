module.exports = async function findReact(matcher, locator) {
  let _locator = `_react=${locator.react}`;

  if (locator.props) {
    for (const [key, value] of Object.entries(locator.props)) {
      _locator += `[${key} = "${value}"]`;
    }
  }

  return matcher.locator(_locator).all();
};
