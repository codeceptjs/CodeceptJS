module.exports.blurElement = (element, context) => {
  const clientSideBlurFn = el => {
    el.blur();
  };

  try {
    // Puppeteer
    context.evaluate(clientSideBlurFn, element);
  } catch (e) {
    // WebDriver
    try {
      context.execute(clientSideBlurFn, element);
    } catch (err) {
      // ignore
    }
  }
};
