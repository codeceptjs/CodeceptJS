module.exports.focusElement = async (element, context) => {
  const clientSideFn = el => {
    el.focus();
  };

  try {
    // Puppeteer
    if (context.constructor.name === 'Frame' || context.constructor.name === 'Page') {
      await element.focus();
    }
  } catch (e) {
    // WebDriver
    try {
      await context.execute(clientSideFn, element);
    } catch (err) {
      console.error('Failed to focus element', err);
    }
  }
};
