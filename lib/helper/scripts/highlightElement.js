module.exports.highlightElement = (element, context) => {
  
  const clientSideHighlightFn = el => {
    const style = '0px 0px 4px 3px rgba(255, 0, 0, 0.7)';
    const prevStyle = el.style.boxShadow;
    el.style.boxShadow = style;
    setTimeout(() => el.style.boxShadow = prevStyle, 2000);
  };

  try {
    // Playwright, Puppeteer
    context.evaluate(clientSideHighlightFn, element);
  } catch (e) {
    // WebDriver
    try {
      context.execute(clientSideHighlightFn, element);
    } catch (err) {
      // ignore
    }
  }
};
