class Secret {
  constructor(secret) {
    this._secret = secret;
  }

  toString() {
    return this._secret;
  }

  static secret(secret) {
    return new Secret(secret);
  }
}

module.exports = Secret;
