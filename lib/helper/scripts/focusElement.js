module.exports.focusElement = (element, context) => {
  const clientSideFn = el => {
    el.focus();
  };

  try {
    // Puppeteer
    context.evaluate(clientSideFn, element);
  } catch (e) {
    // WebDriver
    try {
      context.execute(clientSideFn, element);
    } catch (err) {
      // ignore
    }
  }
};
