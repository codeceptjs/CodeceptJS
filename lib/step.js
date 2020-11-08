// TODO: place MetaStep in other file, disable rule
/* eslint-disable max-classes-per-file */

const store = require('./store');
const Secret = require('./secret');

const STACK_LINE = 4;

// using support objetcs for metastep detection
// deprecated
let support;

/**
 * Each command in test executed through `I.` object is wrapped in Step.
 * Step allows logging executed commands and triggers hook before and after step execution.
 * @param {CodeceptJS.Helper} helper
 * @param {string} name
 */
class Step {
  constructor(helper, name) {
    /** @member {string} */
    this.actor = 'I'; // I = actor
    /** @member {CodeceptJS.Helper} */
    this.helper = helper; // corresponding helper
    /** @member {string} */
    this.name = name; // name of a step console
    /** @member {string} */
    this.helperMethod = name; // helper method
    /** @member {string} */
    this.status = 'pending';
    /**
     * @member {string} suffix
     * @memberof CodeceptJS.Step#
     */
    /** @member {string} */
    this.prefix = this.suffix = '';
    /** @member {string} */
    this.comment = '';
    /** @member {Array<*>} */
    this.args = [];
    /** @member {string} */
    this.stack = '';
    this.setTrace();
  }

  /** @function */
  setTrace() {
    Error.captureStackTrace(this);
    /** @member {MetaStep} */
    this.metaStep = detectMetaStep(this.stack.split('\n'));
  }

  /** @param {Array<*>} args */
  setArguments(args) {
    this.args = args;
  }

  /**
   * @param {...any} args
   * @return {*}
   */
  run() {
    this.args = Array.prototype.slice.call(arguments);
    if (store.dryRun) {
      this.setStatus('success');
      return Promise.resolve(new Proxy({}, dryRunResolver()));
    }
    let result;
    try {
      result = this.helper[this.helperMethod].apply(this.helper, this.args);
      this.setStatus('success');
    } catch (err) {
      this.setStatus('failed');
      throw err;
    }
    return result;
  }

  /** @param {string} status */
  setStatus(status) {
    this.status = status;
    if (this.metaStep) this.metaStep.setStatus(status);
  }

  /** @return {string} */
  humanize() {
    return this.name
    // insert a space before all caps
      .replace(/([A-Z])/g, ' $1')
    // _ chars to spaces
      .replace('_', ' ')
    // uppercase the first character
      .replace(/^(.)|\s(.)/g, $1 => $1.toLowerCase());
  }

  /** @return {string} */
  humanizeArgs() {
    return this.args.map((arg) => {
      if (!arg) {
        return '';
      }
      if (typeof arg === 'string') {
        return `"${arg}"`;
      }
      if (Array.isArray(arg)) {
        try {
          const res = JSON.stringify(arg);
          return res;
        } catch (err) {
          return `[${arg.toString()}]`;
        }
      } else if (typeof arg === 'function') {
        return arg.toString();
      } else if (typeof arg === 'undefined') {
        return `${arg}`;
      } else if (arg instanceof Secret) {
        return '*****';
      } else if (arg.toString && arg.toString() !== '[object Object]') {
        return arg.toString();
      } else if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return arg;
    }).join(', ');
  }

  /** @return {string} */
  line() {
    const lines = this.stack.split('\n');
    if (lines[STACK_LINE]) return lines[STACK_LINE].trim();
    return '';
  }

  /** @return {string} */
  toString() {
    return `${this.prefix}${this.actor} ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`;
  }

  /** @return {string} */
  toCode() {
    return `${this.prefix}${this.actor}.${this.name}(${this.humanizeArgs()})${this.suffix}`;
  }

  isMetaStep() {
    return this.constructor.name === 'MetaStep';
  }

  /** @return {boolean} */
  hasBDDAncestor() {
    let hasBDD = false;
    let processingStep;
    processingStep = this;

    while (processingStep.metaStep) {
      if (processingStep.metaStep.actor.match(/^(Given|When|Then|And)/)) {
        hasBDD = true;
        break;
      } else {
        processingStep = processingStep.metaStep;
      }
    }
    return hasBDD;
  }
}

/** @extends Step */
class MetaStep extends Step {
  constructor(obj, method) {
    super(null, method);
    this.actor = obj;
  }

  humanize() {
    return this.name;
  }

  setTrace() {
  }

  /** @return {void} */
  run() {
  }
}

/** @type {Class<MetaStep>} */
Step.MetaStep = MetaStep;

module.exports = Step;

function detectMetaStep(stack) {
  if (store.debugMode) return; // no detection in debug
  if (!support) loadSupportObjects(); // deprecated

  for (let i = STACK_LINE; i < stack.length; i++) {
    const line = stack[i].trim();
    if (isTest(line) || isBDD(line)) break;
    const fnName = line.match(/^at (\w+)\.(\w+)\s\(/);
    if (!fnName) continue;
    if (fnName[1] === 'Generator'
      || fnName[1] === 'recorder'
      || fnName[1] === 'Runner'
    ) { return; } // don't track meta steps inside generators

    if (fnName[1] === 'Object') {
      // detect PO name from includes
      for (const name in support) {
        const file = support[name];
        if (line.indexOf(file) > -1) {
          return new MetaStep(`${name}:`, fnName[2]);
        }
      }
    }
    return new MetaStep(`${fnName[1]}:`, fnName[2]);
  }
}

function loadSupportObjects() {
  const config = require('./config');
  const path = require('path');
  support = {
    ...config.get('include', {}),
  };
  if (support) {
    for (const name in support) {
      const file = support[name];
      support[name] = path.join(global.codecept_dir, file);
    }
  }
}

function isTest(line) {
  return line.trim().match(/^at Test\.Scenario/);
}

function isBDD(line) {
  return line.trim().match(/^at (Given|When|Then)/);
}

function dryRunResolver() {
  return {
    get(target, prop) {
      if (prop === 'toString') return () => '<VALUE>';
      return new Proxy({}, dryRunResolver());
    },
  };
}
