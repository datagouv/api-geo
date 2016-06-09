const whichCommune = require('./whichCommune');
const normalizeString = require('./normalizeString');
const lunr = require('lunr');
const { intersectionBy, clone } = require('lodash');

function getIndexedDb(options = {}) {
  /* Source dataset */
  const communes = options.communes || require(options.communesDbPath || '../data/communes.json');

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

  function queryByLonLat(lonLat) {
    const result = spatialIndex.query(lonLat);
    return result ? [result] : [];
  }

  function queryByName(nom) {
    return textIndex.search(nom).map(result => {
      const commune = clone(inseeIndex.get(result.ref));
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
    if (inseeIndex.has(codeInsee)) {
      return [inseeIndex.get(codeInsee)];
    } else {
      return [];
    }
  }

  function search(query) {
    const rawResults = [];

    if ('nom' in query) {
      rawResults.push(queryByName(query.nom));
    }

    if ('codePostal' in query) {
      rawResults.push(queryByCP(query.codePostal));
    }

    if ('codeInsee' in query) {
      rawResults.push(queryByCodeInsee(query.codeInsee));
    }

    if ('lat' in query && 'lon' in query) {
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
