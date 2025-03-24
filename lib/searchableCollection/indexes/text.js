const lunr = require('lunr')
const {clone, sortBy} = require('lodash')
const normalizeString = require('../normalizeString')

class TextIndex {
  constructor(key, options = {}) {
    if (!key) {
      throw new Error('key is required')
    }

    this._key = key
    this._boost = options.boost || {}
    this._refKey = options.ref || 'id'
    const refKey = this._refKey
    this._refIndex = new Map()
    this._index = lunr(function () {
      this.field(key)
      this.ref(refKey)

      this.pipeline.reset()
      this.pipeline.add(normalizeString)
    })
  }

  index(item) {
    if (this._key in item) {
      this._index.add(item)
      this._refIndex.set(item[this._refKey], item)
    }
  }

  load(items = []) {
    items.forEach(item => this.index(item))
  }

  find(terms, options = {}) {
    let boosted = false
    let exactResults
    const results = this._index.search(terms)
      .map(result => {
        const item = clone(this._refIndex.get(result.ref))
        if (options.boost && options.boost in this._boost) {
          boosted = true
          item._score = this._boost[options.boost](item, result.score)
        } else {
          item._score = result.score
        }

        return item
      })
    const filtered = results.filter(item => normalizeString(item.nom) === terms)
    if (filtered.length > 0) {
      exactResults = [...filtered, ...results.filter(item => normalizeString(item.nom) !== terms)]
    }

    return boosted ? sortBy(results, c => -c._score) : (exactResults ? exactResults : results)
  }
}

module.exports = TextIndex
