'use strict';

let container = require('./container');
let debug = require('./output').debug; 

class Helper {

  construtor(config) {
    this.config = config;
  }

  _init() {
    
  }

  _before() {

  }

  _after() {

  }

  _beforeStep() {

  }

  _afterStep() {

  }

  get helpers() {
    return container.helpers;
  }
  
  debug(msg) {
    debug(msg);
  }
  
  debugSection(section, msg) {
    debug(`[${section}] ${msg}`);
  }

}

module.exports = Helper;