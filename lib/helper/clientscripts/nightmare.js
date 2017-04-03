if (!window.codeceptjs) {
  let codeceptjs = {};

  // all found elements are stored here for reuse
  codeceptjs.elements = [];

  // global context changer
  codeceptjs.within = null;

  // save
  let storeElement = function (el) {
    if (!el) return;
    return codeceptjs.elements.push(el) - 1; // return index
  };

  let storeElements = function (els) {
    return els.map((el) => storeElement(el));
  };

  // finders
  codeceptjs.fetchElement = function (id) {
    if (!this.elements[id]) throw new Error(`Element (${id}) is not accessible`);
    return this.elements[id];
  };

  codeceptjs.findAndStoreElements = function (by, locator, contextEl) {
    return storeElements(this.findElements(by, locator, contextEl));
  };

  codeceptjs.findAndStoreElement = function (by, locator, contextEl) {
    return storeElement(this.findElement(by, locator, contextEl));
  };

  codeceptjs.setWithin = function (by, locator) {
    this.within = this.findElement(by, locator);
  };

  codeceptjs.findElements = function (by, locator, contextEl) {
    let context;
    if (!contextEl) {
      context = this.within || document;
    } else {
      context = this.fetchElement(contextEl);
    }

    if (by == 'name') {
      by = 'css';
      locator = `*[name="${locator}"]`;
    }
    if (by == 'id') {
      by = 'css';
      locator = `#${locator}`;
    }

    if (by == 'css') {
      let found = context.querySelectorAll(locator);
      let res = [];
      for (let i = 0; i < found.length; i++) {
        res.push(found[i]);
      }
      return res;
    }

    if (by == 'xpath') {
      let found = document.evaluate(locator, context, null, 5);
      let res = [];
      let current = null;
      while (current = found.iterateNext()) {
        res.push(current);
      }
      return res;
    }

    if(by == 'frame') {
      return [locator.reduce((parent, child)=>parent.querySelector(child).contentDocument, window.document).querySelector('body')];
    }
    return [];
  };

  codeceptjs.findElement = function (by, locator, context) {
    return this.findElements(by, locator, context)[0] || null;
  };

  // actions
  codeceptjs.clickEl = function (el) {
    document.activeElement.blur();
    var event = document.createEvent('MouseEvent');
    event.initEvent('click', true, true);
    return this.fetchElement(el).dispatchEvent(event);
  };

  codeceptjs.doubleClickEl = function (el) {
    document.activeElement.blur();
    var event = document.createEvent('MouseEvent');
    event.initEvent('dblclick', true, true);
    this.fetchElement(el).dispatchEvent(event);
  };

  codeceptjs.hoverEl = function (el, x, y) {
    document.activeElement.blur();
    var event = document.createEvent('MouseEvent');
    event.initEvent('mouseover', true, true, x, y, x, y);
    this.fetchElement(el).dispatchEvent(event);
  };

  codeceptjs.checkEl = function (el) {
    var element = this.fetchElement(el);
    var event = document.createEvent('HTMLEvents');
    if (element.checked) return;
    element.checked = true;
    event.initEvent('change', true, true);
    return element.dispatchEvent(event);
  };

  window.codeceptjs = codeceptjs;
}

