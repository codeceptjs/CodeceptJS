const fs = require('fs');

let resqScript;

module.exports = async function findReact(matcher, locator) {
  if (!resqScript) resqScript = fs.readFileSync(require.resolve('resq'));
  await matcher.executionContext().evaluate(resqScript.toString());
  await matcher.executionContext().evaluate(() => window.resq.waitToLoadReact());
  const arrayHandle = await matcher.executionContext().evaluateHandle((selector, props, state, reactElement) => {
    let elements = window.resq.resq$$(selector);
    if (Object.keys(props).length) {
      elements = elements.byProps(props);
    }
    if (Object.keys(state).length) {
      elements = elements.byState(state);
    }

    if (!elements.length) {
      return [];
    }

    // resq returns an array of HTMLElements if the React component is a fragment
    // this avoids having nested arrays of nodes which the driver does not understand
    // [[div, div], [div, div]] => [div, div, div, div]
    let nodes = [];

    elements.forEach((element) => {
      let { node, isFragment } = element;

      if (!node) {
        isFragment = true;
        node = element.children;
      }

      if (isFragment) {
        nodes = nodes.concat(node);
      } else {
        nodes.push(node);
      }
    });

    return [...nodes];
  }, locator.react, locator.props || {}, locator.state || {}, locator.children || {}, matcher);

  const properties = await arrayHandle.getProperties();
  await arrayHandle.dispose();
  const result = [];
  for (const property of properties.values()) {
    const elementHandle = property.asElement();
    if (elementHandle) { result.push(elementHandle); }
  }


  return result;
};
