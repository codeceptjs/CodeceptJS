'use strict';

class Translation {

  constructor(vocabulary, loaded) {
    this.vocabulary = vocabulary;
    this.loaded = loaded !== false;
  }

  value(val) {
    return this.vocabulary[val];
  }

  actionAliasFor(actualActionName) {
    if (this.vocabulary.actions && this.vocabulary.actions[actualActionName]) {
      return this.vocabulary.actions[actualActionName];
    }
    return actualActionName;
  }

  get I() {
    return this.vocabulary.I;
  }
}

module.exports = Translation;
