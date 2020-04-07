function isElementClickable(element) {
  if (!element.getBoundingClientRect || !element.scrollIntoView || !element.contains || !element.getClientRects || !document.elementFromPoint) {
    return false;
  }

  const getOverlappingElement = (element, context = document) => {
    const elemDimension = element.getBoundingClientRect();
    const x = elemDimension.left + (element.clientWidth / 2);
    const y = elemDimension.top + (element.clientHeight / 2);

    return context.elementFromPoint(x, y);
  };

  const getOverlappingRects = (element, context = document) => {
    const rects = element.getClientRects();
    const rect = rects[0];
    const x = rect.left + (rect.width / 2);
    const y = rect.top + (rect.height / 2);

    return context.elementFromPoint(x, y);
  };

  const getOverlappingElements = (element, context) => {
    return [getOverlappingElement(element, context), getOverlappingRects(element, context)];
  };

  const isOverlappingElementMatch = (elementsFromPoint, element) => {
    if (elementsFromPoint.some(elementFromPoint => elementFromPoint === element || element.contains(elementFromPoint))) {
      return true;
    }

    let elementsWithShadowRoot = [...new Set(elementsFromPoint)];
    elementsWithShadowRoot = elementsWithShadowRoot.filter(elem => elem && elem.shadowRoot && elem.shadowRoot.elementFromPoint);

    let shadowElementsFromPoint = [];
    for (const shadowElement of elementsWithShadowRoot) {
      shadowElementsFromPoint.push(...getOverlappingElements(element, shadowElement.shadowRoot));
    }
    shadowElementsFromPoint = [...new Set(shadowElementsFromPoint)];
    shadowElementsFromPoint = shadowElementsFromPoint.filter(element => !elementsFromPoint.includes(element));

    if (shadowElementsFromPoint.length === 0) {
      return false;
    }

    return isOverlappingElementMatch(shadowElementsFromPoint, element);
  };

  const isElementInViewport = (element) => {
    const rect = element.getBoundingClientRect();

    const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
    const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) > 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) > 0);

    return (vertInView && horInView);
  };

  return element.disabled !== true && isElementInViewport(element) && isOverlappingElementMatch(getOverlappingElements(element), element);
}

module.exports = isElementClickable;
