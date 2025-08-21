import merge from 'lodash.merge';
import path from 'path';
import translations from '../translations/index.js';

const defaultVocabulary = {
  I: 'I',
  actions: {},
};

class Translation {
  constructor(vocabulary, loaded) {
    this.vocabulary = vocabulary;
    this.loaded = loaded !== false;
  }

  async loadVocabulary(vocabularyFile) {
    if (!vocabularyFile) return;
    const filePath = path.join(global.codecept_dir, vocabularyFile);

    try {
      let vocabulary;
      if (filePath.endsWith('.json')) {
        // Handle JSON files with fs
        const fs = await import('fs');
        const content = fs.readFileSync(filePath, 'utf8');
        vocabulary = JSON.parse(content);
      } else {
        // Handle JS modules
        const module = await import(filePath);
        vocabulary = module.default || module;
      }
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
    return translations;
  }

  static createDefault() {
    return new Translation(defaultVocabulary, true);
  }

  static createEmpty() {
    return new Translation(defaultVocabulary, false);
  }
}

export default Translation;
