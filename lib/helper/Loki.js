const requireg = require('requireg');
const Helper = require('../helper');

const fileExists = require('../utils').fileExists;
const fileIncludes = require('../assert/include').fileIncludes;
const fileEquals = require('../assert/equal').fileEquals;

const assert = require('assert');
const path = require('path');
const fs = require('fs');

/**
 * Helper with in memory databse for.
 * Can be easily used to :
 *
 * ```js
 * I.amInPath('test');
 * I.seeFile('codecept.json');
 * I.seeInThisFile('FileSystem');
 * I.dontSeeInThisFile("WebDriverIO");
 * ```
 */

class Loki extends Helper {

  constructor(config) {
    super(config);
    loki = requireg('lokijs');

    // set defaults
    this.options = {
      database: "./db.json",
    };

    // override defaults with config
    Object.assign(this.options, config);
  }

  _init() {
    const db = new loki("./database/db.json", {
      autosave: true,
      autosaveInterval: 10000,
    });
  }

  _before() {}


}


module.exports = Loki;
