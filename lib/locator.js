const xpathLocator = require('./utils').xpathLocator;

class Locator {
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

  toString() {
    return this.output || `{${this.type}: '${this.value}'}`;
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

  isStrict() {
    return this.strict;
  }

  isAccessibilityId() {
    return this.isFuzzy() && this.value[0] === '~';
  }
}

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
  ]),

  self: literal => `./self::*[contains(normalize-space(string(.)), ${literal}) or contains(normalize-space(@value), ${literal})]`,
};

Locator.field = {
  labelEquals: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][((./@name = ${literal}) or ./@id = //label[normalize-space(string(.)) = ${literal}]/@for or ./@placeholder = ${literal})]`,
    `.//label[normalize-space(string(.)) = ${literal}]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),
  labelContains: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),
  byName: literal => `.//*[self::input | self::textarea | self::select][@name = ${literal}]`,
  byText: literal => xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]),

};

Locator.checkable = {
  byText: literal => xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
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
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/';
}
