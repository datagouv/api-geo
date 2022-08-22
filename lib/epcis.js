const SearchableCollection = require('./searchableCollection')

const schema = {
  nom: {
    type: 'text',
    queryWith: 'nom',
    ref: 'code',
    boost: {
      population: (epci, score) => {
        if (epci.population) {
          return score * (1 + (epci.population / 100000))
        }

        return score
      }
    }
  },
  code: {type: 'token', queryWith: 'code'},
  codesDepartements: {type: 'tokenList', queryWith: 'codeDepartement'},
  codesRegions: {type: 'tokenList', queryWith: 'codeRegion'},
  zone: {type: 'token', queryWith: 'zone', multiple: 'OR'}
}

function getIndexedDb(options = {}) {
  /* Source dataset */
  const epci = options.epci || require(options.epciDbPath || '../data/epci.json')

  const searchableCollection = new SearchableCollection(schema)
  searchableCollection.load(epci)

  return searchableCollection
}

module.exports = {getIndexedDb}
