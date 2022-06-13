const SearchableCollection = require('./searchableCollection')

const schema = {
  nom: {
    type: 'text',
    queryWith: 'nom',
    ref: 'code'
  },
  code: {type: 'token', queryWith: 'code'},
  codeRegion: {type: 'token', queryWith: 'codeRegion'},
  zone: {type: 'token', queryWith: 'zone', multiple: 'OR'}
}

function getIndexedDb(options = {}) {
  /* Source dataset */
  const departements = options.departements || require(options.departementsDbPath || '../data/departements.json')

  const searchableCollection = new SearchableCollection(schema)
  searchableCollection.load(departements)

  return searchableCollection
}

module.exports = {getIndexedDb}
