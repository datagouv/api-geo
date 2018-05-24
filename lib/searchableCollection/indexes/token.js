class TokenIndex {
  constructor(key, options = {}) {
    if (!key) throw new Error('key is required')
    this._key = key
    this._array = options.array || false
    this._index = new Map()
  }

  indexForToken(token, item) {
    if (this._index.has(token)) {
      this._index.get(token).push(item)
    } else {
      this._index.set(token, [item])
    }
  }

  index(item) {
    if (this._key in item) {
      if (this._array) {
        item[this._key].forEach(token => this.indexForToken(token, item))
      } else {
        this.indexForToken(item[this._key], item)
      }
    }
  }

  load(items = []) {
    items.forEach(item => this.index(item))
  }

  find(token) {
    return this._index.has(token) ? this._index.get(token) : []
  }
}

module.exports = TokenIndex
