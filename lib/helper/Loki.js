const requireg = require('requireg');
const Helper = require('../helper');

const fileExists = require('../utils').fileExists;
const fileIncludes = require('../assert/include').fileIncludes;
const fileEquals = require('../assert/equal').fileEquals;

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const loki = require('lokijs');

/**
 * TODO: Complete this with relevant info
 * Helper with in memory databse for
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
    // loki = requireg('lokijs');

    // set defaults
    this.options = {
      dbName: "./db.json",
      dbOpts: {
        autosave: true,
        autosaveInterval: 10000,
      },
      dbSeed: []
    };

    // override defaults with config
    Object.assign(this.options, config);
  }

  // _init() {
  //   this.db = new loki(this.options.dbName, {
  //     autosave: true,
  //     autosaveInterval: 10000,
  //   });
  // }

  // _before() {}

  // addCollection(data) {}

  _beforeSuite() {
    this._startDb();
  }

  _before() {
    // this.dir = global.codecept_dir;
    // this.file = null;
    // this.debugSection('Dir', this.dir);
    // console.log(this)
  }

  _afterSuite() {
    this._stopDb();
  }

  _startDb() {
    this.db = new loki(this.options.dbName, this.options.dbOpts);
  }

  _stopDb() {
    this.db.close();
  }

  addCollection(data) {
    !this.findCollection(data) && this.db.addCollection(data);
  }

  findCollection(data) {
    return this.db.getCollection(data);
  }
}


module.exports = Loki;
