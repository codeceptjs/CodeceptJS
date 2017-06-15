const Helper = require('../helper');
const fileExists = require('../utils').fileExists;
const fileIncludes = require('../assert/include').fileIncludes;
const fileEquals = require('../assert/equal').fileEquals;

const requireg = require('requireg');
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
      dbName: "db.json",
      dbOpts: {
        autosave: true,
        autosaveInterval: 10000,
      },
      dbSeed: true
    };

    // override defaults with config
    Object.assign(this.options, config);
  }

  static _checkRequirements() {
    try {
      requireg("lokijs");
    } catch (e) {
      return ["lokijs"];
    }
  }

  static _config() {
    return [{
      name: 'dbName',
      message: "What would you like to name the database?",
      default: 'db.json'
    }, {
      name: 'dbSeed',
      type: "confirm",
      message: 'Would you like to enable databse seeding?',
      default: true
    }];
  }

  _init() {
    this.dir = global.codecept_dir;
    this.debugSection('Dir', this.dir);

    this._startDb();
    this.seedDir = path.join("./seed");
    this.options.dbSeed && fs.mkdirSync(this.seedDir);
    this.options.dbSeed && this._loadSeedData();
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

  _loadSeedData() {
    this.importData(this.seedDir);
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

  importData(data) {
    const files = fs.readdirSync(data);
    files.map(i => {
      const fileName = i.substr(0, i.lastIndexOf('.')) || i;
      const filePath = path.join(this.dir, data, i);
      const collection = this.db.addCollection(fileName);
      return collection.insert(require(filePath));
    });
  }
}

module.exports = Loki;
