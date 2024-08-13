let cssToXPath;
const { sprintf } = require('sprintf-js');

const { xpathLocator } = require('./utils');

const locatorTypes = ['css', 'by', 'xpath', 'id', 'name', 'fuzzy', 'frame', 'shadow', 'pw'];
/** @class */
class Locator {
  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @param {string} [defaultType]
   */
  constructor(locator, defaultType = '') {
    this.type = null;
    if (!locator) return;

    this.output = null;

    /**
     * @private
     * @type {boolean}
     */
    this.strict = false;

    if (typeof locator === 'object') {
      if (locator.constructor.name === 'Locator') {
        Object.assign(this, locator);
        return;
      }

      this.locator = locator;
      this.type = Object.keys(locator)[0];
      this.value = locator[this.type];
      this.strict = true;

      Locator.filters.forEach(f => f(locator, this));

      return;
    }

    this.type = defaultType || 'fuzzy';
    this.output = locator;
    this.value = locator;

    if (isCSS(locator)) {
      this.type = 'css';
    }
    if (isXPath(locator)) {
      this.type = 'xpath';
    }
    if (isShadow(locator)) {
      this.type = 'shadow';
    }
    if (isPlaywrightLocator(locator)) {
      this.type = 'pw';
    }

    Locator.filters.forEach(f => f(locator, this));
  }

  simplify() {
    if (this.isNull()) return null;
    switch (this.type) {
      case 'by':
      case 'xpath':
        return this.value;
      case 'css':
        return this.value;
      case 'id':
        return `#${this.value}`;
      case 'name':
        return `[name="${this.value}"]`;
      case 'fuzzy':
        return this.value;
      case 'shadow':
        return { shadow: this.value };
      case 'pw':
        return { pw: this.value };
    }
    return this.value;
  }

  toStrict() {
    if (!this.type) return null;
    return { [this.type]: this.value };
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.output || `{${this.type}: ${this.value}}`;
  }

  /**
   * @returns {boolean}
   */
  isFuzzy() {
    return this.type === 'fuzzy';
  }

  /**
   * @returns {boolean}
   */
  isShadow() {
    return this.type === 'shadow';
  }

  /**
   * @returns {boolean}
   */
  isFrame() {
    return this.type === 'frame';
  }

  /**
   * @returns {boolean}
   */
  isCSS() {
    return this.type === 'css';
  }

  /**
   * @returns {boolean}
   */
  isPlaywrightLocator() {
    return this.type === 'pw';
  }

  /**
   * @returns {boolean}
   */
  isNull() {
    return this.type === null;
  }

  /**
   * @returns {boolean}
   */
  isXPath() {
    return this.type === 'xpath';
  }

  /**
   * @returns {boolean}
   */
  isCustom() {
    return !!this.type && !locatorTypes.includes(this.type);
  }

  /**
   * @returns {boolean}
   */
  isStrict() {
    return this.strict;
  }

  /**
   * @returns {boolean}
   */
  isAccessibilityId() {
    return this.isFuzzy() && this.value[0] === '~';
  }

  /**
   * @returns {boolean}
   */
  isBasic() {
    return this.isCSS() || this.isXPath();
  }

  /**
   * @param {string} [pseudoSelector] CSS to XPath extension pseudo: https://www.npmjs.com/package/csstoxpath?activeTab=explore#extension-pseudos
   * @returns {string}
   */
  toXPath(pseudoSelector = '') {
    const locator = `${this.value}${pseudoSelector}`;
    const limitation = [':nth-of-type', ':first-of-type', ':last-of-type', ':nth-last-child', ':nth-last-of-type', ':checked', ':disabled', ':enabled', ':required', ':lang', ':nth-child', ':has'];

    if (limitation.some(item => locator.includes(item))) {
      cssToXPath = require('css-to-xpath');
    } else {
      cssToXPath = require('csstoxpath');
    }

    if (this.isXPath()) return this.value;
    if (this.isCSS()) return cssToXPath(locator);

    throw new Error('Can\'t be converted to XPath');
  }

  // DSL
  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  or(locator) {
    const xpath = xpathLocator.combine([
      this.toXPath(),
      (new Locator(locator, 'css')).toXPath(),
    ]);
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  find(locator) {
    const xpath = sprintf('%s//%s', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  withChild(locator) {
    const xpath = sprintf('%s[./child::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  withDescendant(locator) {
    const xpath = sprintf('%s[./descendant::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {number} position
   * @returns {Locator}
   */
  at(position) {
    if (position === 0) {
      throw new Error('0 is not valid element position. XPath expects first element to have index 1');
    }

    let xpathPosition;

    if (position > 0) {
      xpathPosition = position.toString();
    } else {
      // -1 points to the last element
      xpathPosition = `last()-${Math.abs(position + 1)}`;
    }
    const xpath = sprintf('(%s)[position()=%s]', this.toXPath(), xpathPosition);
    return new Locator({ xpath });
  }

  /**
   * @returns {Locator}
   */
  first() {
    return this.at(1);
  }

  /**
   * @returns {Locator}
   */
  last() {
    return this.at(-1);
  }

  /**
   * Find an element containing a text
   * @param {string} text
   * @returns {Locator}
   */
  withText(text) {
    text = xpathLocator.literal(text);
    const xpath = sprintf('%s[%s]', this.toXPath(), `contains(., ${text})`);
    return new Locator({ xpath });
  }

  /**
   * Find an element with exact text
   * @param {string} text
   * @returns {Locator}
   */
  withTextEquals(text) {
    text = xpathLocator.literal(text);
    const xpath = sprintf('%s[%s]', this.toXPath(), `.= ${text}`);
    return new Locator({ xpath });
  }

  /**
   * @param {Object.<string, string>} attributes
   * @returns {Locator}
   */
  withAttr(attributes) {
    const operands = [];
    for (const attr of Object.keys(attributes)) {
      operands.push(`@${attr} = ${xpathLocator.literal(attributes[attr])}`);
    }
    const xpath = sprintf('%s[%s]', this.toXPath(), operands.join(' and '));
    return new Locator({ xpath });
  }

  /**
     * Adds condition: attribute value starts with text
     * (analog of XPATH: [starts-with(@attr,'startValue')] or CSS [attr^='startValue']
     * Example: I.click(locate('a').withAttrStartsWith('href', 'https://')));
     * Works with any attribute: class, href etc.
     * @param {string} attrName
     * @param {string} startsWith
     * @returns {Locator}
    */
  withAttrStartsWith(attrName, startsWith) {
    const xpath = sprintf('%s[%s]', this.toXPath(), `starts-with(@${attrName}, "${startsWith}")`);
    return new Locator({ xpath });
  }

  /**
    * Adds condition: attribute value ends with text
    * (analog of XPATH: [ends-with(@attr,'endValue')] or CSS [attr$='endValue']
    * Example: I.click(locate('a').withAttrEndsWith('href', '.com')));
    * Works with any attribute: class, href etc.
    * @param {string} attrName
    * @param {string} endsWith
    * @returns {Locator}
  */
  withAttrEndsWith(attrName, endsWith) {
    const xpath = sprintf('%s[%s]', this.toXPath(), `substring(@${attrName}, string-length(@${attrName}) - string-length("${endsWith}") + 1) = "${endsWith}"`,
    );
    return new Locator({ xpath });
  }

  /**
     * Adds condition: attribute value contains text
     * (analog of XPATH: [contains(@attr,'partOfAttribute')] or CSS [attr*='partOfAttribute']
     * Example: I.click(locate('a').withAttrContains('href', 'google')));
     * Works with any attribute: class, href etc.
     * @param {string} attrName
     * @param {string} partOfAttrValue
     * @returns {Locator}
     */
  withAttrContains(attrName, partOfAttrValue) {
    const xpath = sprintf('%s[%s]', this.toXPath(), `contains(@${attrName}, "${partOfAttrValue}")`);
    return new Locator({ xpath });
  }

  /**
   * @param {String} text
   * @returns {Locator}
   */
  withClassAttr(text) {
    const xpath = sprintf('%s[%s]', this.toXPath(), `contains(@class, '${text}')`);
    return new Locator({ xpath });
  }

  /**
   * @param {string} output
   * @returns {Locator}
   */
  as(output) {
    this.output = output;
    return this;
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  inside(locator) {
    const xpath = sprintf('%s[ancestor::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  after(locator) {
    const xpath = sprintf('%s[preceding-sibling::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @returns {Locator}
   */
  before(locator) {
    const xpath = sprintf('%s[following-sibling::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }
}

/**
 * @param {CodeceptJS.LocatorOrString} locator
 * @returns {Locator}
 */
Locator.build = (locator) => {
  if (!locator) return new Locator({ xpath: '//*' });
  return new Locator(locator, 'css');
};

/**
 * Filters to modify locators
 * @type {Array<function(CodeceptJS.LocatorOrString, Locator): void>}
 */
Locator.filters = [];

/**
 * Appends new `Locator` filter to an `Locator.filters` array, and returns the new length of the array.
 * @param {function(CodeceptJS.LocatorOrString, Locator): void} fn
 * @returns {number}
 */
Locator.addFilter = fn => Locator.filters.push(fn);

Locator.clickable = {
  /**
   * @param {string} literal
   * @returns {string}
   */
  narrow: literal => xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`,
  ]),

  /**
   * @param {string} literal
   * @returns {string}
   */
  wide: literal => xpathLocator.combine([
    `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
    `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
    `.//button[contains(normalize-space(string(.)), ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
    `.//button[./@name = ${literal}]`,
    `.//*[@aria-label = ${literal}]`,
    `.//*[@title = ${literal}]`,
    `.//*[@aria-labelledby = //*[@id][normalize-space(string(.)) = ${literal}]/@id ]`,
  ]),

  /**
   * @param {string} literal
   * @returns {string}
   */
  self: literal => `./self::*[contains(normalize-space(string(.)), ${literal}) or contains(normalize-space(@value), ${literal})]`,
};

Locator.field = {
  /**
   * @param {string} literal
   * @returns {string}
   */
  labelEquals: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][((./@name = ${literal}) or ./@id = //label[@for][normalize-space(string(.)) = ${literal}]/@for or ./@placeholder = ${literal})]`,
    `.//label[normalize-space(string(.)) = ${literal}]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),

  /**
   * @param {string} literal
   * @returns {string}
   */
  labelContains: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[@for][contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
    `.//*[@aria-label = ${literal}]`,
    `.//*[@title = ${literal}]`,
    `.//*[@aria-labelledby = //*[@id][normalize-space(string(.)) = ${literal}]/@id ]`,
  ]),

  /**
   * @param {string} literal
   * @returns {string}
   */
  byName: literal => `.//*[self::input | self::textarea | self::select][@name = ${literal}]`,

  /**
   * @param {string} literal
   * @returns {string}
   */
  byText: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[@for][contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),

};

Locator.checkable = {
  /**
   * @param {string} literal
   * @returns {string}
   */
  byText: literal => xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[@for][contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`,
  ]),

  /**
   * @param {string} literal
   * @returns {string}
   */
  byName: literal => `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`,
};

Locator.select = {
  /**
   * @param {string} opt
   * @returns {string}
   */
  byVisibleText: (opt) => {
    const normalized = `[normalize-space(.) = ${opt.trim()}]`;
    return `./option${normalized}|./optgroup/option${normalized}`;
  },

  /**
   * @param {string} opt
   * @returns {string}
   */
  byValue: (opt) => {
    const normalized = `[normalize-space(@value) = ${opt.trim()}]`;
    return `./option${normalized}|./optgroup/option${normalized}`;
  },
};

module.exports = Locator;

/**
 * @private
 * Checks if `locator` is CSS locator
 * @param {string} locator
 *
 * @returns {boolean}
 */
function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.' || locator[0] === '[';
}

/**
 * @private
 * Checks if `locator` is XPath locator
 * @param {string} locator
 *
 * @returns {boolean}
 */
function isXPath(locator) {
  const trimmed = locator.replace(/^\(+/, '').substr(0, 2);
  return trimmed === '//' || trimmed === './';
}

/**
 * @private
 * **Experimental!** Works for WebDriver helper only
 *
 * Checks if `locator` is shadow locator.
 *
 * Shadow locators are
 * `{ shadow: ['my-app', 'recipe-hello', 'button'] }`
 *
 * @param {{shadow: string[]}} locator
 *
 * @returns {boolean}
 */
function isShadow(locator) {
  const hasShadowProperty = (locator.shadow !== undefined) && (Object.keys(locator).length === 1);
  return hasShadowProperty;
}

/**
 * @private
 * Checks if xpath starts with `(`
 * @param {string} xpath
 * @returns {boolean}
 */
function isXPathStartingWithRoundBrackets(xpath) {
  return isXPath(xpath) && xpath[0] === '(';
}

/**
 * @private
 * Removes `./` and `.//` symbols from xpath's start
 * @param {string} xpath
 * @returns {string}
 */
function removePrefix(xpath) {
  return xpath
    .replace(/^(\.|\/)+/, '');
}

/**
 * @private
 * check if the locator is a Playwright locator
 * @param {string} locator
 * @returns {boolean}
 */
function isPlaywrightLocator(locator) {
  return locator.includes('_react') || locator.includes('_vue');
}

/**
 * @private
 * @param {CodeceptJS.LocatorOrString} locator
 * @returns {string}
 */
function convertToSubSelector(locator) {
  const xpath = (new Locator(locator, 'css')).toXPath();
  if (isXPathStartingWithRoundBrackets(xpath)) {
    throw new Error('XPath with round brackets is not possible here! '
      + 'May be a nested locator with at() last() or first() causes this error.');
  }
  return removePrefix(xpath);
}
