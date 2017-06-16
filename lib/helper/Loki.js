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
 */

class Loki extends Helper {

  constructor(config) {
    super(config);
    // set defaults
    this.options = {
      dbName: "db.json",
      dbOpts: {
        autosave: true,
        autosaveInterval: 1000,
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
    //set global directory
    this.dir = global.codecept_dir;
    this.debugSection('Dir', this.dir);

    //Creates/Initialises the database
    this.db = new loki(this.options.dbName, this.options.dbOpts);
    //Creates seed data directory if necessary and imports the contents.
    this.seedDir = path.join("./seed");
    this.options.dbSeed && mkdirSync(this.seedDir);
    this.options.dbSeed && this._loadSeedData();
  }

  _beforeSuite() {
  }

  _afterSuite() {
    this._stopDb();
  }

  _startDb() {
  }

  _stopDb() {
    this.db.close();
  }

  _loadSeedData() {
    this.importData(this.seedDir);
  }

  /**
   *
   * Will check for an existing collection of the same name and return that, if it already exists.
   * @param {string} collection creates a collection with supplied name.
   */
  addCollection(collection) {
    return !this.findCollection(collection) && this.db.addCollection(collection);
  }
  /**
   *
   * @param {string} collection name of desired collection.
   */
  findCollection(collection) {
    return this.db.getCollection(collection);
  }
  /**
   *
   * Removes a matching collection.
   * @param {string} collection finds a collection that matches the supplied name
   */
  removeCollection(collection) {
    return this.db.removeCollection(collection);
  }
  /**
   *
   * Inserts records from the supplied data to a matching collection.
   * @param {string} collection name of desired collection.
   * @param {Object[]} data takes an array of objects as records for the destination collection.
   */
  insert(collection, data) {
    const c = this.findCollection(collection);
    return c.insert(data);
  }
  /**
   *
   * Clears data from a matching collection.
   * @param {string} collection name of desired collection.
   */
  clear(collection) {
    const c = this.findCollection(collection);
    return c.clear();
  }
  /**
   * Searches the Users colection for matching values.
   * @param {string} collection name of desired collection.
   * @param {Object} query used in searching the destination collection for matching values.
   * @example
   * // Searches for a user with an email of "someone@email.com"
   * I.find("Users",{email: "someone@email.com"})
   * @returns {Object[]} Returns an array of objects that match.
   */
  find(collection, query) {
    const c = this.findCollection(collection);
    return c.find(query);
  }
  /**
   *
   * Effectively the same as `find()` but returns a single object rather than an array.
   * @param {string} collection name of desired collection.
   * @param {Object} query used in searching the destination collection for matching values.
   */
  findOne(collection, query) {
    const c = this.findCollection(collection);
    return c.findOne(query);
  }
  /**
   *
   * Finds a list of values based on the supplied query and runs an update function on each result.
   * @param {string} collection name of desired collection.
   * @param {Object} query used in searching the destination collection for matching values.
   * @param {function} updateFunction executes against each of the results in the result array.
   * @example
   * // Before {email: "someone@email.com", firstname: "Some", surname: "One", address1: "1 Some Place"}
   * I.findAndUpdate("users",{email: "someone@email.com"},(res)=>{res.number = "01234567890"})
   * // Find updated record
   * I.findOne("Users",{email: "someone@email.com"})
   * // After {email: "someone@email.com", firstname: "Some", surname: "One", address1: "1 Some Place", number:01234567890}
   */
  findAndUpdate(collection, query, updateFunction) {
    const c = this.findCollection(collection);
    return c.findAndUpdate(query, updateFunction);
  }
  /**
   *
   * Like `findAndUpdate()` but finds a record in a collection and removes it.
   * @param {string} collection name of desired collection.
   * @param {Object} query used in searching the destination collection for matching values.
   */
  findAndRemove(collection, query) {
    const c = this.findCollection(collection);
    return c.findAndRemove(query);
  }
  /**
   *
   * Imports data from a directory into a collection. Uses file names to create a collection of the same name and imports the contents of the file as records to the destination.
   * @param {string} dir takes a directory as a string.
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

function mkdirSync(dir) {
  try {
    fs.mkdirSync(dir);
  } catch (e) {
    if (e.code !== "EEXIST") {
      throw e;
    }
  }
}

module.exports = Loki;
