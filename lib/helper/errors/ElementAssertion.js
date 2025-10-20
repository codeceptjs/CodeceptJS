const Locator = require('../../locator');

const prefixMessage = 'Element';

function seeElementError(locator) {
  if (typeof locator === 'object') {
    locator = JSON.stringify(locator);
  }
  throw new Error(`${prefixMessage} "${(new Locator(locator))}" is still visible on page.`);
}

function seeElementInDOMError(locator) {
  if (typeof locator === 'object') {
    locator = JSON.stringify(locator);
  }
  throw new Error(`${prefixMessage} "${(new Locator(locator))}" is still seen in DOM.`);
}

function dontSeeElementError(locator) {
  if (typeof locator === 'object') {
    locator = JSON.stringify(locator);
  }
  throw new Error(`${prefixMessage} "${(new Locator(locator))}" is not visible on page.`);
}

function dontSeeElementInDOMError(locator) {
  if (typeof locator === 'object') {
    locator = JSON.stringify(locator);
  }
  throw new Error(`${prefixMessage} "${(new Locator(locator))}" is not seen in DOM.`);
}

module.exports = {
  seeElementError,
  dontSeeElementError,
  seeElementInDOMError,
  dontSeeElementInDOMError,
};
