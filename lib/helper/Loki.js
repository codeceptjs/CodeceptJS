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
 * Helper with in memory databse for data driven testing and result capturing.
 * Can be easily used to create dynamic seed data:
 *
 * ```js
 *
 * ```
 */

class Loki extends Helper {

  constructor(config) {
    super(config);
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

  /**
   *
   * @param {string} collection creates a collection with supplied name.
   * Will check for an existing collection and return that,
   * if it already exists.
   */
  addCollection(collection) {
    return !this.findCollection(collection) && this.db.addCollection(collection);
  }
  /**
   *
   * @param {string} collection finds a collection that matches the supplied name.
   */
  findCollection(collection) {
    return this.db.getCollection(collection);
  }
  /**
   *
   * @param {string} collection removes a collection that matches the supplied name.
   */
  removeCollection(collection) {
    return this.db.removeCollection(collection);
  }
  /**
   *
   * @param {string} collection finds a collection that matches the supplied name.
   * @param {Object[]} data takes an array of Objects and inserts each as a record in to the destination collection.
   */
  insert(collection, data) {
    const c = this.findCollection(collection);
    return c.insert(data);
  }
  /**
   * @param {string} collection clears data from a collection that matches the supplied name.
   */
  clear(collection) {
    const c = this.findCollection(collection);
    return c.clear();
  }
  /**
   *
   * @param {string} collection finds a collection that matches the supplied name.
   * @param {Object} query takes an Object and searches the destination collection for values that match.
   * @example
   * // Searches the Users colection for a user with email someone@email.com
   * I.find("Users",{email: "someone@email.com"})
   * @returns {Object[]} Returns an array of objects that match.
   */
  find(collection, query) {
    const c = this.findCollection(collection);
    return c.find(query);
  }
  /**
   *
   * @param {string} dir takes a directory string and creates an array of filenames within the directory.
   * Each file is turned in to a collection of the same name by taking the filename, creating a collection and
   * importing the contents of the file as records to the destination collection.
   */
  importData(dir) {
    const files = fs.readdirSync(dir);
    files.map(i => {
      const fileName = i.substr(0, i.lastIndexOf('.')) || i;
      const filePath = path.join(this.dir, dir, i);
      const collection = this.db.addCollection(fileName);
      return collection.insert(require(filePath));
    });
  }
}

module.exports = Loki;
