const { deepClone } = require('./utils');

const maskedString = '*****';

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
    return maskedString;
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
  const handler = {
    get(obj, prop) {
      if (prop === 'toString') {
        return function () {
          const maskedObject = deepClone(obj);
          fieldsToHide.forEach(f => (maskedObject[f] = maskedString));
          return JSON.stringify(maskedObject);
        };
      }
      return fieldsToHide.includes(prop) ? new Secret(obj[prop]) : obj[prop];
    },
  };

  return new Proxy(obj, handler);
}

module.exports = Secret;
