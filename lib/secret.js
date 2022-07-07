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
   * @param {*} secret
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
  const handler = {
    get(obj, prop) {
      if (prop === 'toString') {
        return function () {
          const maskedObject = deepClone(obj);
          fieldsToHide.forEach(f => maskedObject[f] = '****');
          return JSON.stringify(maskedObject);
        };
      }

      return obj[prop];
    },
  };

  return new Proxy(obj, handler);
}

module.exports = Secret;
