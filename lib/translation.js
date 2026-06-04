import merge from 'lodash.merge'
import path from 'path'
import { createRequire } from 'module'
import store from './store.js'

const defaultVocabulary = {
  I: 'I',
  actions: {},
}

class Translation {
  constructor(vocabulary, loaded) {
    this.vocabulary = vocabulary
    this.loaded = loaded !== false
  }

  loadVocabulary(vocabularyFile) {
    if (!vocabularyFile) return

    let filePath;
    if (path.isAbsolute(vocabularyFile)) {
      filePath = vocabularyFile;
    } else {
      filePath = path.join(store.codeceptDir, vocabularyFile);
    }

    try {
      const require = createRequire(import.meta.url)
      const vocabulary = require(filePath)
      this.vocabulary = merge(this.vocabulary, vocabulary)
    } catch (err) {
      throw new Error(`Can't load vocabulary from ${filePath}; ${err}`)
    }
  }

  value(val) {
    return this.vocabulary[val]
  }

  actionAliasFor(actualActionName) {
    if (this.vocabulary.actions && this.vocabulary.actions[actualActionName]) {
      return this.vocabulary.actions[actualActionName]
    }
    return actualActionName
  }

  get I() {
    return this.vocabulary.I
  }

  static async getLangs() {
    const translations = await import('../translations/index.js')
    return translations.default
  }

  static get langs() {
    // Synchronous fallback - may be empty initially
    if (!this._cachedLangs) {
      this.getLangs().then(langs => {
        this._cachedLangs = langs
      })
      return {}
    }
    return this._cachedLangs
  }

  static createDefault() {
    return new Translation(defaultVocabulary, true)
  }

  static createEmpty() {
    return new Translation(defaultVocabulary, false)
  }
}

export default Translation
