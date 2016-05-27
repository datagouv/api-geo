const whichCommune = require('./whichCommune');
const removeDiacritics = require('./removeDiacritics');
const lunr = require('lunr');

/* Source dataset */
const communes = require('../data/communes.json');

/* Indexes */
const spatialIndex = whichCommune();
const textIndex = lunr(function () {
  this.field('nom');
  this.ref('codeInsee');

  this.pipeline.reset();
  this.pipeline.add(function (token) {
    return normalizeNom(token);
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

function normalizeNom(nom) {
  return removeDiacritics(nom)
  .toLowerCase()
  .replace(/[^a-z]/g, '');
}

function query(lon, lat) {
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

module.exports = { query, queryByCodeInsee, queryByCP, queryByName, normalizeNom };
