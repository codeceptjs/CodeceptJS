/** @param {string} secret */
class Secret {
  constructor(secret) {
    this._secret = secret;
  }

  /** @returns {string} */
  toString() {
    return this._secret;
  }

  /**
   * @param {*} secret
   * @returns {Secret}
   */
  static secret(secret) {
    return new Secret(secret);
  }
}

module.exports = Secret;
