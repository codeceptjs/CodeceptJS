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

  _init() {
    this._startDb();
    this.importSeed(this.options.dbSeed);
  }

  _beforeSuite() {}

  _before() {}

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
    return !this.findCollection(data) && this.db.addCollection(data);
  }

  findCollection(data) {
    return this.db.getCollection(data);
  }

  removeCollection(data) {
    return this.db.removeCollection(data);
  }

  insert(collection, data) {
    const c = this.findCollection(collection);
    return c.insert(data);
  }

  importSeed(array = []) {
    array.map(i => {
      const name = i.substr(0, i.lastIndexOf('.')) || i;
      const collection = this.db.addCollection(name);
      return collection.insert(require(i));
    });
  }
}

module.exports = Loki;
