const cssToXPath = require('css-to-xpath');
const { sprintf } = require('sprintf-js');

const { xpathLocator } = require('./utils');

const locatorTypes = ['css', 'by', 'xpath', 'id', 'name', 'fuzzy', 'frame'];
/** @class */
class Locator {
  /**
   * @param {CodeceptJS.LocatorOrString}  locator
   * @param {string}  [defaultType]
   */
  constructor(locator, defaultType = '') {
    this.type = null;
    if (!locator) return;

    this.output = null;
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
    }
    return this.value;
  }

  toStrict() {
    if (!this.type) return null;
    return { [this.type]: this.value };
  }

  /**
   * @return  {string}
   */
  toString() {
    return this.output || `{${this.type}: ${this.value}}`;
  }

  isFuzzy() {
    return this.type === 'fuzzy';
  }

  isFrame() {
    return this.type === 'frame';
  }

  isCSS() {
    return this.type === 'css';
  }

  isNull() {
    return this.type === null;
  }

  isXPath() {
    return this.type === 'xpath';
  }

  isCustom() {
    return this.type && !locatorTypes.includes(this.type);
  }

  isStrict() {
    return this.strict;
  }

  isAccessibilityId() {
    return this.isFuzzy() && this.value[0] === '~';
  }

  /**
   * @return  {string}
   */
  toXPath() {
    if (this.isXPath()) return this.value;
    if (this.isCSS()) return cssToXPath(this.value);
    throw new Error('Can\'t be converted to XPath');
  }

  // DSL
  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @return  {Locator}
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
   * @return  {Locator}
   */
  find(locator) {
    const xpath = sprintf('%s//%s', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @return  {Locator}
   */
  withChild(locator) {
    const xpath = sprintf('%s[./child::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @return  {Locator}
   */
  withDescendant(locator) {
    const xpath = sprintf('%s[./descendant::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {number}  position
   * @return {Locator}
   */
  at(position) {
    if (position < 0) {
      position++; // -1 points to the last element
      position = `last()-${Math.abs(position)}`;
    }
    if (position === 0) {
      throw new Error('0 is not valid element position. XPath expects first element to have index 1');
    }
    const xpath = sprintf('(%s)[position()=%s]', this.toXPath(), position);
    return new Locator({ xpath });
  }

  /**
   * @return  {Locator}
   */
  first() {
    return this.at(1);
  }

  /**
   * @return  {Locator}
   */
  last() {
    return this.at(-1);
  }

  /**
   * @param {string} text
   * @return  {Locator}
   */
  withText(text) {
    text = xpathLocator.literal(text);
    const xpath = sprintf('%s[%s]', this.toXPath(), `contains(., ${text})`);
    return new Locator({ xpath });
  }

  /**
   * @param {Object.<string, string>} attrs
   * @return  {Locator}
   */
  withAttr(attrs) {
    const operands = [];
    for (const attr of Object.keys(attrs)) {
      operands.push(`@${attr} = ${xpathLocator.literal(attrs[attr])}`);
    }
    const xpath = sprintf('%s[%s]', this.toXPath(), operands.join(' and '));
    return new Locator({ xpath });
  }

  /**
   * @param {string} output
   * @return  {Locator}
   */
  as(output) {
    this.output = output;
    return this;
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @return  {Locator}
   */
  inside(locator) {
    const xpath = sprintf('%s[ancestor::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @return  {Locator}
   */
  after(locator) {
    const xpath = sprintf('%s[preceding-sibling::%s]', this.toXPath(), convertToSubSelector(locator));
    return new Locator({ xpath });
  }

  /**
   * @param {CodeceptJS.LocatorOrString} locator
   * @return  {Locator}
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

Locator.filters = [];

Locator.addFilter = fn => Locator.filters.push(fn);

Locator.clickable = {
  narrow: literal => xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`,
  ]),

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

  self: literal => `./self::*[contains(normalize-space(string(.)), ${literal}) or contains(normalize-space(@value), ${literal})]`,
};

Locator.field = {
  labelEquals: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][((./@name = ${literal}) or ./@id = //label[@for][normalize-space(string(.)) = ${literal}]/@for or ./@placeholder = ${literal})]`,
    `.//label[normalize-space(string(.)) = ${literal}]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),
  labelContains: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[@for][contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
    `.//*[@aria-label = ${literal}]`,
    `.//*[@title = ${literal}]`,
    `.//*[@aria-labelledby = //*[@id][normalize-space(string(.)) = ${literal}]/@id ]`,
  ]),
  byName: literal => `.//*[self::input | self::textarea | self::select][@name = ${literal}]`,
  byText: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[@for][contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),

};

Locator.checkable = {
  byText: literal => xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[@for][contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`,
  ]),

  byName: literal => `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`,
};

Locator.select = {
  byVisibleText: (opt) => {
    const normalized = `[normalize-space(.) = ${opt.trim()}]`;
    return `./option${normalized}|./optgroup/option${normalized}`;
  },

  byValue: (opt) => {
    const normalized = `[normalize-space(@value) = ${opt.trim()}]`;
    return `./option${normalized}|./optgroup/option${normalized}`;
  },

};

module.exports = Locator;

function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.';
}

function isAccessibility(locator) {
  return locator[0] === '~';
}

function isXPath(locator) {
  const trimmed = locator.replace(/^\(+/, '').substr(0, 2);
  return trimmed === '//' || trimmed === './';
}

function isXPathStartingWithRoundBrackets(locator) {
  return isXPath(locator) && locator[0] === '(';
}

function removePrefix(xpath) {
  return xpath
    .replace(/^(\.|\/)+/, '');
}

function convertToSubSelector(locator) {
  const xpath = (new Locator(locator, 'css')).toXPath();
  if (isXPathStartingWithRoundBrackets(xpath)) {
    throw new Error('XPath with round brackets is not possible here! '
      + 'May be a nested locator with at() last() or first() causes this error.');
  }
  return removePrefix(xpath);
}
