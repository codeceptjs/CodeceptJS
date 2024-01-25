// TODO: place MetaStep in other file, disable rule
/* eslint-disable max-classes-per-file */
const store = require('./store');
const Secret = require('./secret');
const event = require('./event');

const STACK_LINE = 4;

/**
 * Each command in test executed through `I.` object is wrapped in Step.
 * Step allows logging executed commands and triggers hook before and after step execution.
 * @param {CodeceptJS.Helper} helper
 * @param {string} name
 */
class Step {
  static get TIMEOUT_ORDER() {
    return {
      /**
       * timeouts set with order below zero only override timeouts of higher order if their value is smaller
       */
      testOrSuite: -5,
      /**
       * 0-9 - designated for override of timeouts set from code, 5 is used by stepTimeout plugin when stepTimeout.config.overrideStepLimits=true
       */
      stepTimeoutHard: 5,
      /**
       * 10-19 - designated for timeouts set from code, 15 is order of I.setTimeout(t) operation
       */
      codeLimitTime: 15,
      /**
       * 20-29 - designated for timeout settings which could be overriden in tests code, 25 is used by stepTimeout plugin when stepTimeout.config.overrideStepLimits=false
       */
      stepTimeoutSoft: 25,
    };
  }

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
    /** @member {MetaStep} */
    this.metaStep = undefined;
    /** @member {string} */
    this.stack = '';

    const timeouts = new Map();
    /**
     * @method
     * @returns {number|undefined}
     */
    this.getTimeout = function () {
      let totalTimeout;
      // iterate over all timeouts starting from highest values of order
      new Map([...timeouts.entries()].sort().reverse()).forEach((timeout, order) => {
        if (timeout !== undefined && (
          // when orders >= 0 - timeout value overrides those set with higher order elements
          order >= 0

          // when `order < 0 && totalTimeout === undefined` - timeout is used when nothing is set by elements with higher order
          || totalTimeout === undefined

          // when `order < 0` - timeout overrides higher values of timeout or 'no timeout' (totalTimeout === 0) set by elements with higher order
          || timeout > 0 && (timeout < totalTimeout || totalTimeout === 0)
        )) {
          totalTimeout = timeout;
        }
      });
      return totalTimeout;
    };
    /**
     * @method
     * @param {number} timeout - timeout in milliseconds or 0 if no timeout
     * @param {number} order - order defines the priority of timeout, timeouts set with lower order override those set with higher order.
     *                         When order below 0 value of timeout only override if new value is lower
     */
    this.setTimeout = function (timeout, order) {
      timeouts.set(order, timeout);
    };

    this.setTrace();
  }

  /** @function */
  setTrace() {
    Error.captureStackTrace(this);
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
      if (this.helperMethod !== 'say') {
        result = this.helper[this.helperMethod].apply(this.helper, this.args);
      }
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
    if (this.metaStep) {
      this.metaStep.setStatus(status);
    }
  }

  /** @return {string} */
  humanize() {
    return humanizeString(this.name);
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
        return arg.getMasked();
      } else if (arg.toString && arg.toString() !== '[object Object]') {
        return arg.toString();
      } else if (typeof arg === 'object') {
        const returnedArg = {};
        for (const [key, value] of Object.entries(arg)) {
          returnedArg[key] = value;
          if (value instanceof Secret) returnedArg[key] = value.getMasked();
        }
        return JSON.stringify(returnedArg);
      }
      return arg;
    }).join(', ');
  }

  /** @return {string} */
  line() {
    const lines = this.stack.split('\n');
    if (lines[STACK_LINE]) {
      return lines[STACK_LINE].trim().replace(global.codecept_dir || '', '.').trim();
    }
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

  /** @return {boolean} */
  isBDD() {
    if (this.actor && this.actor.match && this.actor.match(/^(Given|When|Then|And)/)) {
      return true;
    }
    return false;
  }

  isWithin() {
    if (this.actor && this.actor.match && this.actor.match(/^(Within)/)) {
      return true;
    }
    return false;
  }

  toString() {
    const actorText = this.actor;

    if (this.isBDD() || this.isWithin()) {
      return `${this.prefix}${actorText} ${this.name} "${this.humanizeArgs()}${this.suffix}"`;
    }

    if (actorText === 'I') {
      return `${this.prefix}${actorText} ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`;
    }

    return `On ${this.prefix}${actorText}: ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`;
  }

  humanize() {
    return humanizeString(this.name);
  }

  setTrace() {
  }

  setContext(context) {
    this.context = context;
  }

  /** @return {*} */
  run(fn) {
    this.status = 'queued';
    this.setArguments(Array.from(arguments).slice(1));
    let result;

    const registerStep = (step) => {
      this.metaStep = null;
      step.metaStep = this;
    };
    event.dispatcher.prependListener(event.step.before, registerStep);
    // Handle async and sync methods.
    if (fn.constructor.name === 'AsyncFunction') {
      result = fn.apply(this.context, this.args).then((result) => {
        return result;
      }).catch((error) => {
        this.setStatus('failed');
        throw error;
      }).finally(() => {
        this.endTime = Date.now();
        event.dispatcher.removeListener(event.step.before, registerStep);
      });
    } else {
      try {
        this.startTime = Date.now();
        result = fn.apply(this.context, this.args);
      } catch (error) {
        this.setStatus('failed');
        throw error;
      } finally {
        this.endTime = Date.now();
        event.dispatcher.removeListener(event.step.before, registerStep);
      }
    }

    return result;
  }
}

Step.TIMEOUTS = {};

/** @type {Class<MetaStep>} */
Step.MetaStep = MetaStep;

module.exports = Step;

function dryRunResolver() {
  return {
    get(target, prop) {
      if (prop === 'toString') return () => '<VALUE>';
      return new Proxy({}, dryRunResolver());
    },
  };
}

function humanizeString(string) {
  // split strings by words, then make them all lowercase
  const _result = string.replace(/([a-z](?=[A-Z]))/g, '$1 ')
    .split(' ')
    .map(word => word.toLowerCase());

  _result[0] = _result[0] === 'i' ? capitalizeFLetter(_result[0]) : _result[0];
  return _result.join(' ').trim();
}

function capitalizeFLetter(string) {
  return (string[0].toUpperCase() + string.slice(1));
}
