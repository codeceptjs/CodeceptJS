/* eslint-disable max-classes-per-file */
const { deepClone } = require('./utils');

/** @param {string} secret */
class Secret {
  constructor(secret) {
    this._secret = secret;
  }

  /** @returns {string} */
  toString() {
    return this._secret;
  }

  getMasked() {
    return '*****';
  }

  /**
   * @param {...*} secret
   * @returns {Secret}
   */
  static secret(secret) {
    if (typeof secret === 'object') {
      const fields = Array.from(arguments);
      fields.shift();
      return secretObject(secret, fields);
    }
    return new Secret(secret);
  }
}

function secretObject(obj, fieldsToHide = []) {
  const maskedObject = deepClone(obj);
  fieldsToHide.forEach(f => maskedObject[f] = new Secret(maskedObject[f]));
  return maskedObject;
}

module.exports = Secret;
