const whichCommune = require('./whichCommune');
const normalizeString = require('./normalizeString');
const lunr = require('lunr');
const { intersectionBy, clone, sortBy } = require('lodash');

function getIndexedDb(options = {}) {
  /* Source dataset */
  const communes = options.communes || require(options.communesDbPath || '../data/communes.json');

  /* Indexes */
  const spatialIndex = whichCommune();
  const textIndex = lunr(function () {
    this.field('nom');
    this.ref('code');

    this.pipeline.reset();
    this.pipeline.add(normalizeString);
  });
  const cpIndex = new Map();
  const codeDepIndex = new Map();
  const codeRegIndex = new Map();
  const inseeIndex = new Map();

  /* Indexing */
  communes.forEach(commune => {
    spatialIndex.insert(commune);
    textIndex.add(commune);
    inseeIndex.set(commune.code, commune);

    if (codeDepIndex.has(commune.codeDepartement)) {
      codeDepIndex.get(commune.codeDepartement).push(commune);
    } else {
      codeDepIndex.set(commune.codeDepartement, [commune]);
    }

    if (codeRegIndex.has(commune.codeRegion)) {
      codeRegIndex.get(commune.codeRegion).push(commune);
    } else {
      codeRegIndex.set(commune.codeRegion, [commune]);
    }

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

  function queryByName(nom, boost) {
    const results = textIndex.search(nom)
      .map(result => {
        const commune = clone(inseeIndex.get(result.ref));
        if (boost === 'population' && commune.population) {
          commune._score = result.score * (1 + commune.population / 100000);
        } else {
          commune._score = result.score;
        }
        return commune;
      });
    return boost ? sortBy(results, c => -c._score) : results;
  }

  function queryByDep(codeDepartement) {
    if (codeDepIndex.has(codeDepartement)) {
      return codeDepIndex.get(codeDepartement);
    } else {
      return [];
    }
  }

  function queryByReg(codeRegion) {
    if (codeRegIndex.has(codeRegion)) {
      return codeRegIndex.get(codeRegion);
    } else {
      return [];
    }
  }

  function queryByCP(codePostal) {
    if (cpIndex.has(codePostal)) {
      return cpIndex.get(codePostal);
    } else {
      return [];
    }
  }

  function queryByCode(code) {
    if (inseeIndex.has(code)) {
      return [inseeIndex.get(code)];
    } else {
      return [];
    }
  }

  function search(query) {
    const rawResults = [];

    if ('nom' in query) {
      rawResults.push(queryByName(query.nom, query.boost));
    }

    if ('codePostal' in query) {
      rawResults.push(queryByCP(query.codePostal));
    }

    if ('code' in query) {
      rawResults.push(queryByCode(query.code));
    }

    if ('codeDepartement' in query) {
      rawResults.push(queryByDep(query.codeDepartement));
    }

    if ('codeRegion' in query) {
      rawResults.push(queryByReg(query.codeRegion));
    }

    if ('lat' in query && 'lon' in query) {
      rawResults.push(queryByLonLat([query.lon, query.lat]));
    }

    return rawResults.length === 1 ? rawResults[0] : intersectionBy(...rawResults, 'code');
  }

  return {
    queryByLonLat,
    queryByCode,
    queryByDep,
    queryByReg,
    queryByCP,
    queryByName,
    search,
    spatialIndex,
    textIndex,
    cpIndex,
    codeDepIndex,
    codeRegIndex,
    inseeIndex,
    communes,
  };
}

module.exports = { getIndexedDb };
