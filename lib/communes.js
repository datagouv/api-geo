const whichCommune = require('./whichCommune');
const normalizeString = require('./normalizeString');
const lunr = require('lunr');
const { intersectionBy } = require('lodash');

function getIndexedDb(options = {}) {
  /* Source dataset */
  const communes = require(options.communesDbPath || '../data/communes.json');

  /* Indexes */
  const spatialIndex = whichCommune();
  const textIndex = lunr(function () {
    this.field('nom');
    this.ref('codeInsee');

    this.pipeline.reset();
    this.pipeline.add(function (token) {
      return normalizeString(token);
    });
  });
  const cpIndex = new Map();
  const inseeIndex = new Map();

  /* Indexing */
  communes.forEach(commune => {
    spatialIndex.insert(commune);
    textIndex.add(commune);
    inseeIndex.set(commune.codeInsee, commune);
    commune.codesPostaux.forEach(codePostal => {
      if (cpIndex.has(codePostal)) {
        cpIndex.get(codePostal).push(commune);
      } else {
        cpIndex.set(codePostal, [commune]);
      }
    });
  });

  function queryByLonLat(lon, lat) {
    const result = spatialIndex.query(lon, lat);
    return result ? [result] : [];
  }

  function queryByName(nom) {
    return textIndex.search(nom).map(result => {
      const commune = inseeIndex.get(result.ref);
      commune._score = result.score;
      return commune;
    });
  }

  function queryByCP(codePostal) {
    if (cpIndex.has(codePostal)) {
      return cpIndex.get(codePostal);
    } else {
      return [];
    }
  }

  function queryByCodeInsee(codeInsee) {
    return inseeIndex.get(codeInsee);
  }

  function search(query) {
    const rawResults = [];

    if (query.nom) {
      rawResults.push(queryByName(query.nom));
    }

    if (query.codePostal) {
      rawResults.push(queryByCP(query.codePostal));
    }

    if (query.codeInsee) {
      rawResults.push(queryByCodeInsee(query.codeInsee));
    }

    if (query.lat && query.lon) {
      rawResults.push(queryByLonLat([query.lon, query.lat]));
    }

    return rawResults.length === 1 ? rawResults[0] : intersectionBy(...rawResults, 'codeInsee');
  }

  return {
    queryByLonLat,
    queryByCodeInsee,
    queryByCP,
    queryByName,
    search,
    spatialIndex,
    textIndex,
    cpIndex,
    inseeIndex,
    communes,
  };
}

module.exports = { getIndexedDb };
