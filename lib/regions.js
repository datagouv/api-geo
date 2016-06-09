const normalizeString = require('./normalizeString');
const lunr = require('lunr');
const { clone, intersectionBy } = require('lodash');

function getIndexedDb(options = {}) {
  /* Source dataset */
  const regions = options.regions || require(options.regionsDbPath || '../data/regions.json');

  /* Indexes */
  const textIndex = lunr(function () {
    this.field('nom');
    this.ref('code');

    this.pipeline.reset();
    this.pipeline.add(function (token) {
      return normalizeString(token);
    });
  });
  const inseeIndex = new Map();

  /* Indexing */
  regions.forEach(departement => {
    textIndex.add(departement);
    inseeIndex.set(departement.code, departement);
  });

  function getAll() {
    return regions;
  }

  function queryByName(nom) {
    return textIndex.search(nom).map(result => {
      const departement = clone(inseeIndex.get(result.ref));
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

  function search(query = {}) {
    const rawResults = [];

    if ('nom' in query) {
      rawResults.push(queryByName(query.nom));
    }

    if ('code' in query) {
      rawResults.push(queryByCode(query.code));
    }

    if (rawResults.length === 0) return getAll();
    if (rawResults.length === 1) return rawResults[0];
    return intersectionBy(...rawResults, 'code');
  }

  return {
    getAll,
    queryByCode,
    queryByName,
    search,
    textIndex,
    inseeIndex,
    regions,
  };
}

module.exports = { getIndexedDb };
