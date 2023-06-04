module.exports.highlightElement = (element, context) => {
  try {
    context.evaluate(el => el.style.border = '2px solid red', element);
  } catch (e) {
    context.execute(el => el.style.border = '2px solid red', element);
  }
};

module.exports.unhighlightElement = (element, context) => {
  try {
    context.evaluate(el => el.style.border = '', element);
  } catch (e) {
    context.execute(el => el.style.border = '', element);
  }
};
