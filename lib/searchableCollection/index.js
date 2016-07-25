const { intersectionBy } = require('lodash');
const GeoIndex = require('./indexes/geo');
const TokenIndex = require('./indexes/token');
const TextIndex = require('./indexes/text');

class SearchableCollection {
  constructor(schema, options = {}) {
    if (!schema) throw new Error('schema is required');
    this._schema = schema;
    this._options = options;
    this._indexes = {};
    this._queryKeys = {};
    for (let key in schema) {
      this.processSchemaEntry(key, schema[key]);
    }
  }

  processSchemaEntry(key, params) {
    let queryWith;
    let index;
    switch (params.type) {
    case 'token':
      queryWith = params.queryWith || key;
      index = new TokenIndex(key);
      this._indexes[key] = index;
      this._queryKeys[queryWith] = index;
      break;
    case 'tokenList':
      queryWith = params.queryWith || key;
      index = new TokenIndex(key, { array: true });
      this._indexes[key] = index;
      this._queryKeys[queryWith] = index;
      break;
    case 'text':
      queryWith = params.queryWith || key;
      index = new TextIndex(key, params);
      this._indexes[key] = index;
      this._queryKeys[queryWith] = index;
      break;
    case 'geo':
      queryWith = params.queryWith;
      index = new GeoIndex(key);
      this._indexes[key] = index;
      this._queryKeys[queryWith] = index;
      break;
    }
  }

  load(items) {
    this._data = items;
    for (let indexName in this._indexes) {
      this._indexes[indexName].load(items);
    }
  }

  search(query) {
    const rawResults = [];
    for (let key in query) {
      if (key in this._queryKeys) {
        rawResults.push(this._queryKeys[key].find(query[key]));
      }
    }
    if (rawResults.length === 0) return this._data;
    if (rawResults.length === 1) return rawResults[0];
    return intersectionBy(...rawResults, 'code');
  }
}

module.exports = SearchableCollection;
