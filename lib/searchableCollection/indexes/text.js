const normalizeString = require('../normalizeString');
const lunr = require('lunr');
const { clone, sortBy } = require('lodash');

class TextIndex {
  constructor(key, options = {}) {
    if (!key) throw new Error('key is required');
    this._key = key;
    this._boost = options.boost || {};
    const refKey = this._refKey = options.ref || 'id';
    this._refIndex = new Map();
    this._index = lunr(function () {
      this.field(key);
      this.ref(refKey);

      this.pipeline.reset();
      this.pipeline.add(normalizeString);
    });
  }

  index(item) {
    if (this._key in item) {
      this._index.add(item);
      this._refIndex.set(item[this._refKey], item);
    }
  }

  load(items = []) {
    items.forEach(item => this.index(item));
  }

  find(terms, options = {}) {
    let boosted = false;
    const results = this._index.search(terms)
      .map(result => {
        const item = clone(this._refIndex.get(result.ref));
        if (options.boost && options.boost in this._boost) {
          boosted = true;
          item._score = this._boost(options.boost)(item, result.score);
        } else {
          item._score = result.score;
        }
        return item;
      });
    return boosted ? sortBy(results, c => -c._score) : results;
  }
}

module.exports = TextIndex;
