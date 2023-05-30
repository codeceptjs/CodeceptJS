module.exports.highlightElement = (element, context) => {
  context.evaluate(el => el.style.border = '2px solid red', element);
};

module.exports.unhighlightElement = (element, context) => {
  context.evaluate(el => el.style.border = '', element);
};
