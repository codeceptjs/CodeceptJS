'use strict';

let event = require('./event');

/**
 * Each command in test executed through `I.` object is wrapped in Step.
 * Step allows logging executed commands and triggers hook before and after step execution.
 */
class Step {

  constructor(helper, name) {
    this.helper = helper;
    this.name = name;
    this.status = 'pending';
    this.prefix = this.suffix = '';
  }

  run() {
    this.args = Array.prototype.slice.call(arguments);
    event.dispatcher.emit(event.step.init, this);
    this.status = 'queued';
    event.dispatcher.emit(event.step.before, this);
    let result;
    try {
      result = this.helper[this.name].apply(this.helper, this.args);
      this.status = 'success';
    } catch (err) {
      this.status = 'failed';
      throw err;
    } finally {
      event.dispatcher.emit(event.step.after, this);
    }
    return result;
  }

  humanize() {
    return this.name
    // insert a space before all caps
    .replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^(.)|\s(.)/g, function ( $1 ) { return $1.toLowerCase( ); } );
  }

  humanizeArgs() {
    return this.args.map((arg) => {
      if (typeof(arg) === "string" ) {
        return `"${arg}"`;
      } else if (Array.isArray(arg)) {
        return `[${arg.toString()}]`;
      } else if (typeof(arg) === "function" ) {
        return "function()";
      } else if (typeof(arg) === "object" ) {
        return JSON.stringify(arg);
      } else if (arg.toString) {
        return arg.toString();
      }
      return arg;
    }).join(', ');
  }

  toString() {
    return `${this.prefix}I ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`;
  }

  toCode() {
    return `${this.prefix}I.${this.name}(${this.humanizeArgs()})${this.suffix}`;
  }

}

module.exports = Step;
