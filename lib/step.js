const Config = require('./config');
const path = require('path');

let support;

const STACK_LINE = 3;

/**
 * Each command in test executed through `I.` object is wrapped in Step.
 * Step allows logging executed commands and triggers hook before and after step execution.
 */
class Step {
  constructor(helper, name) {
    this.actor = 'I'; // I = actor
    this.helper = helper; // corresponding helper
    this.name = name; // name of a step console
    this.helperMethod = name; // helper method
    this.status = 'pending';
    this.prefix = this.suffix = '';
    this.comment = '';
    this.args = [];
    this.stack = '';
    this.setTrace();
  }

  setTrace() {
    Error.captureStackTrace(this);
    this.metaStep = detectMetaStep(this.stack.split('\n'));
  }

  setArguments(args) {
    this.args = args;
  }

  run() {
    this.args = Array.prototype.slice.call(arguments);
    let result;
    try {
      result = this.helper[this.helperMethod].apply(this.helper, this.args);
      this.status = 'success';
    } catch (err) {
      this.status = 'failed';
      throw err;
    }
    return result;
  }

  humanize() {
    return this.name
    // insert a space before all caps
      .replace(/([A-Z])/g, ' $1')
    // _ chars to spaces
      .replace('_', ' ')
    // uppercase the first character
      .replace(/^(.)|\s(.)/g, $1 => $1.toLowerCase());
  }

  humanizeArgs() {
    return this.args.map((arg) => {
      if (typeof arg === 'string') {
        return `"${arg}"`;
      } else if (Array.isArray(arg)) {
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
      } else if (arg.toString && arg.toString() !== '[object Object]') {
        return arg.toString();
      } else if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return arg;
    }).join(', ');
  }

  line() {
    const lines = this.stack.split('\n');
    // 3rd line is line where step has been called in test
    if (lines[STACK_LINE]) return lines[STACK_LINE].trim();
    return '';
  }

  toString() {
    return `${this.prefix}${this.actor} ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`;
  }

  toCode() {
    return `${this.prefix}${this.actor}.${this.name}(${this.humanizeArgs()})${this.suffix}`;
  }

  isMetaStep() {
    return this.constructor.name === 'MetaStep';
  }
}


class MetaStep extends Step {
  constructor(obj, method) {
    super(null, method);
    this.actor = obj;
  }

  setTrace() {
  }

  run() {
  }
}

Step.MetaStep = MetaStep;

module.exports = Step;

function loadSupportObjects() {
  support = Config.get('include', {});
  if (support) {
    for (const name in support) {
      const file = support[name];
      support[name] = path.join(global.codecept_dir, file);
    }
  }
}

function detectMetaStep(stack) {
  if (!support) loadSupportObjects();

  for (let i = STACK_LINE; i < stack.length; i++) {
    const line = stack[i].trim();
    if (!isTest(line)) continue;
    // console.log('aaa');
    if (i === STACK_LINE) return;
    for (const name in support) {
      const file = support[name];
      const caller = stack[i - 1].trim();
      // const caller = stack[i-1].trim().match(/^at (\w+\.\w+)\s\(/);
      if (caller.indexOf(file) > -1) {
        // console.log('YEAAAH!!!!', name);
        let fnName = caller.match(/^at \w+\.(.*?)\(/);
        if (fnName[1]) {
          fnName = fnName[1].trim();
        }
        return new MetaStep(name, fnName);
      }
    }
    return;
  }
}

function isTest(line) {
  return line.trim().match(/^at Test\.Scenario/);
}
