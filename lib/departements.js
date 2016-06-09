const normalizeString = require('./normalizeString');
const lunr = require('lunr');
const { intersectionBy } = require('lodash');

function getIndexedDb(options = {}) {
  /* Source dataset */
  const departements = options.departements || require(options.departementsDbPath || '../data/departements.json');

  /* Indexes */
  const textIndex = lunr(function () {
    this.field('nom');
    this.ref('code');

    this.pipeline.reset();
    this.pipeline.add(function (token) {
      return normalizeString(token);
    });
  });
  const regionIndex = new Map();
  const inseeIndex = new Map();

  /* Indexing */
  departements.forEach(departement => {
    textIndex.add(departement);
    inseeIndex.set(departement.code, departement);
    if (regionIndex.has(departement.codeRegion)) {
      regionIndex.get(departement.codeRegion).push(departement);
    } else {
      regionIndex.set(departement.codeRegion, [departement]);
    }
  });

  function getAll() {
    return departements;
  }

  function queryByName(nom) {
    return textIndex.search(nom).map(result => {
      const departement = inseeIndex.get(result.ref);
      departement._score = result.score;
      return departement;
    });
  }

  function queryByCode(code) {
    if (inseeIndex.has(code)) {
      return [inseeIndex.get(code)];
    } else {
      return [];
    }
  }

  function queryByCodeRegion(codeRegion) {
    if (regionIndex.has(codeRegion)) {
      return regionIndex.get(codeRegion);
    } else {
      return [];
    }
  }

  function search(query) {
    const rawResults = [];

    if ('nom' in query) {
      rawResults.push(queryByName(query.nom));
    }

    if ('codeRegion' in query) {
      rawResults.push(queryByCodeRegion(query.codeRegion));
    }

    if ('code' in query) {
      rawResults.push(queryByCode(query.code));
    }

    return rawResults.length === 1 ? rawResults[0] : intersectionBy(...rawResults, 'code');
  }

  return {
    getAll,
    queryByCode,
    queryByName,
    queryByCodeRegion,
    search,
    textIndex,
    regionIndex,
    inseeIndex,
    departements,
  };
}

module.exports = { getIndexedDb };
