const {intersectionBy} = require('lodash')
const GeoIndex = require('./indexes/geo')
const TokenIndex = require('./indexes/token')
const TextIndex = require('./indexes/text')

const createIndexByType = {
  token: key => new TokenIndex(key),
  tokenList: key => new TokenIndex(key, {array: true}),
  text: (key, params) => new TextIndex(key, params),
  geo: key => new GeoIndex(key)
}

class SearchableCollection {
  constructor(schema, options = {}) {
    if (!schema) throw new Error('schema is required')
    this._schema = schema
    this._options = options
    this._indexes = {}
    this._queryKeys = {}
    Object.keys(schema).forEach(key => {
      this.processSchemaEntry(key, schema[key])
    })
  }

  processSchemaEntry(key, params) {
    const queryWith = params.queryWith || key
    const index = createIndexByType[params.type](key, params)
    this._indexes[key] = index
    this._queryKeys[queryWith] = index
  }

  load(items) {
    this._data = items
    Object.keys(this._indexes).forEach(indexName => {
      this._indexes[indexName].load(items)
    })
  }

  search(query) {
    const rawResults = []
    for (const key in query) {
      if (key in this._queryKeys) {
        rawResults.push(this._queryKeys[key].find(query[key], query))
      }
    }
    if (rawResults.length === 0) return this._data
    if (rawResults.length === 1) return rawResults[0]
    return intersectionBy(...rawResults, 'code')
  }
}

module.exports = SearchableCollection
