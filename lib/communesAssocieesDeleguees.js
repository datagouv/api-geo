const SearchableCollection = require('./searchableCollection')

const schema = {
  nom: {
    type: 'text',
    queryWith: 'nom',
    ref: 'code',
    boost: {
      population: (commune, score) => {
        if (commune.population) {
          return score * (1 + (commune.population / 100000))
        }

        return score
      }
    }
  },
  type: {type: 'token', queryWith: 'type', multiple: 'OR'},
  code: {type: 'token', queryWith: 'code'},
  codesPostaux: {type: 'tokenList', queryWith: 'codePostal'},
  siren: {type: 'token', queryWith: 'siren'},
  codeEpci: {type: 'token', queryWith: 'codeEpci'},
  codeDepartement: {type: 'token', queryWith: 'codeDepartement'},
  codeRegion: {type: 'token', queryWith: 'codeRegion'},
  zone: {type: 'token', queryWith: 'zone', multiple: 'OR'},
  contour: {type: 'geo', queryWith: 'pointInContour'}
}

function getIndexedDb(options = {}) {
  /* Source dataset */
  const communesAssocieesDeleguees = options.communesAssocieesDeleguees || require(options.communesAssocieesDelegueesDbPath || '../data/communes-associees-deleguees.json')

  const searchableCollection = new SearchableCollection(schema)
  searchableCollection.load(communesAssocieesDeleguees)

  return searchableCollection
}

module.exports = {getIndexedDb}
