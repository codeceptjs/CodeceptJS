const STACK_LINE = 4;
const stacktrace = require('stacktrace-js');
const { insertHistory, getLastPageObject } = require('./history');
const { stringHash } = require('./utils');

// using support objetcs for metastep detection
// deprecated
let support;

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
    this.callTree = [];
    this.args = [];
    this.stack = '';
    this.setTrace();
  }

  setTrace() {
    Error.captureStackTrace(this);
    this.metaStep = detectMetaStep(this.stack.split('\n'));
  }

  setCallTree() {
    const dd = stacktrace.getSync().reverse();
    const containerCalled = false;
    dd.forEach((trace) => {
      if (trace.functionName) {
        if (trace.functionName.indexOf('Scenario') > -1 ||
          trace.functionName.indexOf('BeforeSuite') > -1 ||
          trace.functionName.indexOf('Before') > -1 ||
          trace.functionName.indexOf('Background') > -1 ||
          trace.functionName.indexOf('AfterSuite') > -1 ||
          trace.functionName.indexOf('After') > -1) {
          this.callTree.push({
            id: `${trace.columnNumber}-${trace.lineNumber}-${stringHash(trace.fileName)}`,
            parentid: 0,
          });
        }

        if (trace.functionName.indexOf('Object') > -1 && trace.functionName.indexOf('Object.keys.map.forEach') === -1 && trace.functionName.indexOf('Object.obj.') === -1 && trace.fileName && trace.fileName.indexOf('container.js') === -1) {
          if (this.callTree.length === 0) {
            this.callTree = getLastPageObject();
          }
          this.callTree.push({
            id: `${trace.columnNumber}-${trace.lineNumber}-${stringHash(trace.fileName)}`,
            parentid: this.callTree[this.callTree.length - 1].id,
          });
        }
      }
    });


    this.callTree[this.callTree.length - 1] =
      {
        ...this.callTree[this.callTree.length - 1],
        step: { args: this.humanizeArgs(), name: this.humanize(), actor: this.actor },
      };
    insertHistory(this.callTree);
  }

  setArguments(args) {
    this.args = args;
  }

  run() {
    this.args = Array.prototype.slice.call(arguments);
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

  setStatus(status) {
    this.status = status;
    if (this.metaStep) this.metaStep.setStatus(status);
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

  humanize() {
    return this.name;
  }

  setTrace() {
  }

  run() {
  }
}

Step.MetaStep = MetaStep;

module.exports = Step;

function detectMetaStep(stack) {
  if (!support) loadSupportObjects(); // deprecated

  for (let i = STACK_LINE; i < stack.length; i++) {
    const line = stack[i].trim();
    if (isTest(line) || isBDD(line)) break;
    const fnName = line.match(/^at (\w+)\.(\w+)\s\(/);
    if (!fnName) continue;
    if (fnName[1] === 'Generator') return; // don't track meta steps inside generators
    if (fnName[1] === 'recorder') return; // don't track meta steps inside generators
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
  const Config = require('./config');
  const path = require('path');
  support = Config.get('include', {});
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
