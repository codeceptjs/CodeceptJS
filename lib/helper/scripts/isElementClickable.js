function isElementClickable(elem) {
  if (!elem.getBoundingClientRect || !elem.scrollIntoView || !document.elementFromPoint) {
    return false;
  }

  const isElementInViewport = (elem) => {
    const rect = elem.getBoundingClientRect();
    const verticleInView = (rect.top <= window.innerHeight) && ((rect.top + rect.height) > 0);
    const horizontalInView = (rect.left <= window.innerWidth) && ((rect.left + rect.width) > 0);
    return horizontalInView && verticleInView;
  };

  const getOverlappingElement = (elem) => {
    const rect = elem.getBoundingClientRect();
    const x = rect.left + (elem.clientWidth / 2);
    const y = rect.top + (elem.clientHeight / 2);
    return document.elementFromPoint(x, y);
  };

  const isClickable = elem => elem.disabled !== true && isElementInViewport(elem) && getOverlappingElement(elem) === elem;
  return isClickable(elem);
}

module.exports = isElementClickable;
