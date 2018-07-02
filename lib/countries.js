const SearchableCollection = require('./searchableCollection')

const schema = {
  nom: {
    type: 'text',
    queryWith: 'nom',
    ref: 'code'
  },
  code: {type: 'token', queryWith: 'code'}
}

function getIndexedDb(options = {}) {
  /* Source dataset */
  const countries = options.countries || require(options.countriesDbPath || '../data/countries.json')

  const searchableCollection = new SearchableCollection(schema)
  searchableCollection.load(countries)

  return searchableCollection
}

module.exports = {getIndexedDb}
