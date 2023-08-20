module.exports = async function findReact(matcher, locator) {
  let _locator = `_react=${locator.react}`;

  if (locator.props && locator.props.name) {
    _locator += `[name = "${locator.props.name}"]`;
  }

  return matcher.locator(_locator).all();
};
