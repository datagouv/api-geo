const SearchableCollection = require('./searchableCollection');
const { abbreviations } = require('./communeHelpers.js');

const schema = {
  nom: {
    type: 'text',
    queryWith: 'nom',
    ref: 'code',
    replacePatterns: abbreviations,
    boost: {
      population: (commune, score) => {
        if (commune.population) {
          return score * (1 + commune.population / 100000);
        } else {
          return score;
        }
      },
    },
  },
  code: { type: 'token', queryWith: 'code' },
  codesPostaux: { type: 'tokenList', queryWith: 'codePostal' },
  codeDepartement: { type: 'token', queryWith: 'codeDepartement' },
  codeRegion: { type: 'token', queryWith: 'codeRegion' },
  contour: { type: 'geo', queryWith: 'pointInContour' },
};

function getIndexedDb(options = {}) {
  /* Source dataset */
  const communes = options.communes || require(options.communesDbPath || '../data/communes.json');

  const searchableCollection = new SearchableCollection(schema);
  searchableCollection.load(communes);

  return searchableCollection;
}

module.exports = { getIndexedDb };
