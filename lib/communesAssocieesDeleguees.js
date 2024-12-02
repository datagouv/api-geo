const SearchableCollection = require('./searchableCollection')

const schema = {
  nom: {
    type: 'text',
    queryWith: 'nom',
    ref: 'code'
  },
  type: {type: 'token', queryWith: 'type', multiple: 'OR'},
  chefLieu: {type: 'token', queryWith: 'chefLieu'},
  code: {type: 'token', queryWith: 'code'},
  codeEpci: {type: 'token', queryWith: 'codeEpci'},
  codeDepartement: {type: 'token', queryWith: 'codeDepartement'},
  codeRegion: {type: 'token', queryWith: 'codeRegion'},
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
