const merge = require('lodash.merge');
const path = require('path');

const defaultVocabulary = {
  I: 'I',
  actions: {},
};

class Translation {
  constructor(vocabulary, loaded) {
    this.vocabulary = vocabulary;
    this.loaded = loaded !== false;
  }

  loadVocabulary(vocabularyFile) {
    if (!vocabularyFile) return;
    const filePath = path.join(global.codecept_dir, vocabularyFile);

    try {
      const vocabulary = require(filePath);
      this.vocabulary = merge(this.vocabulary, vocabulary);
    } catch (err) {
      throw new Error(`Can't load vocabulary from ${filePath}; ${err}`);
    }
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

  static get langs() {
    return require('../translations');
  }

  static createDefault() {
    return new Translation(defaultVocabulary, true);
  }

  static createEmpty() {
    return new Translation(defaultVocabulary, false);
  }
}

module.exports = Translation;
