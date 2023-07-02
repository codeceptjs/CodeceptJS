module.exports.highlightElement = (element, context) => {
  try {
    context.evaluate(el => {
      const style = '0px 0px 4px 3px rgba(255, 0, 0, 0.7)';
      const prevStyle = el.style.boxShadow;
      el.style.boxShadow = style;
      setTimeout(() => el.style.boxShadow = prevStyle, 2000);
    }, element);
  } catch (e) {
    // ignore highlight
  }
};
