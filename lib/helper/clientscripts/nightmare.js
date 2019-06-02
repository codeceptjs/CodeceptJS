if (!window.codeceptjs) {
  const codeceptjs = {};

  // all found elements are stored here for reuse
  codeceptjs.elements = [];

  // global context changer
  codeceptjs.within = null;

  // save
  const storeElement = function (el) {
    if (!el) return;
    return codeceptjs.elements.push(el) - 1; // return index
  };

  const storeElements = function (els) {
    return els.map(el => storeElement(el));
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
    if (typeof contextEl !== 'number') {
      context = this.within || document;
    } else {
      context = this.fetchElement(contextEl);
    }

    if (by === 'name') {
      by = 'css';
      locator = `*[name="${locator}"]`;
    }
    if (by === 'id') {
      by = 'css';
      locator = `#${locator}`;
    }

    if (by === 'css') {
      const found = context.querySelectorAll(locator);
      const res = [];
      for (let i = 0; i < found.length; i++) {
        res.push(found[i]);
      }
      return res;
    }

    if (by === 'xpath') {
      const found = document.evaluate(locator, context, null, 5, null);
      const res = [];
      let current = null;
      while (current = found.iterateNext()) {
        res.push(current);
      }
      return res;
    }

    if (by === 'frame') {
      if (!Array.isArray(locator)) locator = [locator];
      return [locator.reduce((parent, child) => parent.querySelector(child).contentDocument, window.document).querySelector('body')];
    }
    return [];
  };

  codeceptjs.findElement = function (by, locator, context) {
    return this.findElements(by, locator, context)[0] || null;
  };

  // actions
  codeceptjs.clickEl = function (el) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const event = document.createEvent('MouseEvent');
    event.initEvent('click', true, true);
    return this.fetchElement(el).dispatchEvent(event);
  };

  codeceptjs.doubleClickEl = function (el) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const event = document.createEvent('MouseEvent');
    event.initEvent('dblclick', true, true);
    this.fetchElement(el).dispatchEvent(event);
  };

  codeceptjs.hoverEl = function (el, x, y) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      screenX: x,
      screenY: y,
      clientX: x,
      clientY: y,
    });

    this.fetchElement(el).dispatchEvent(event);
  };


  codeceptjs.rightClickEl = function (el) {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: 2,
    });

    this.fetchElement(el).dispatchEvent(event);
  };

  codeceptjs.checkEl = function (el) {
    const element = this.fetchElement(el);
    const event = document.createEvent('HTMLEvents');
    if (element.checked) return;
    element.checked = true;
    event.initEvent('change', true, true);
    return element.dispatchEvent(event);
  };

  codeceptjs.unCheckEl = function (el) {
    const element = this.fetchElement(el);
    const event = document.createEvent('HTMLEvents');
    element.checked = false;
    event.initEvent('change', true, true);
    return element.dispatchEvent(event);
  };

  window.codeceptjs = codeceptjs;
}
