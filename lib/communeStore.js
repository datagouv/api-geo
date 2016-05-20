'use strict';

const JSONStream = require('JSONStream');
const t = require('through2').obj;
const fs = require('fs');
const Promise = require('bluebird');
const debug = require('debug')('store');
const centroid = require('turf-centroid');
const whichCommune = require('./whichCommune');
const removeDiacritics = require('./removeDiacritics');
const { pick } = require('lodash');
const lunr = require('lunr');

const communes = {};
const index = whichCommune();
const textIndex = lunr(function () {
  this.field('nom');
  this.ref('codeInsee');

  this.pipeline.reset();
  this.pipeline.add(function (token) {
    return normalizeNom(token);
  });
});
const cpIndex = new Map();


function normalizeNom(nom) {
  return removeDiacritics(nom)
  .toLowerCase()
  .replace(/[^a-z]/g, '');
}

function loadCommunes() {
  debug('charge le référentiel communes');
  let count = 0;
  return new Promise((resolve, reject) => {
    fs.createReadStream(__dirname + '/../data/communes-dp25.json')
      .pipe(JSONStream.parse('features.*'))
      .pipe(t((communeFeature, enc, cb) => {
        const commune = {
          codeInsee: communeFeature.properties.insee,
          nom: communeFeature.properties.nom,
          codesPostaux: [],
          contour: communeFeature.geometry,
          centre: centroid(communeFeature).geometry,
          surface: communeFeature.properties.surf_ha
        };
        textIndex.add(commune);
        communes[commune.codeInsee] = commune;
        index.insert(commune);
        count++;
        cb();
      }))
      .on('error', reject)
      .on('finish', () => {
        debug('total des communes chargées : %d', count);
        resolve();
      });
  });
}

function loadCodePostaux() {
  debug('charge les codes postaux');

  let count = 0;
  function addCodePostalToCommune(codePostal, codeInsee) {
    if (!(codeInsee in communes)) {
      debug('Code INSEE non trouvé: %s', codeInsee);
      return;
    }
    const commune = communes[codeInsee];
    if (cpIndex.has(codePostal)) {
      cpIndex.get(codePostal).push(commune);
    } else {
      cpIndex.set(codePostal, [commune]);
    }
    commune.codesPostaux.push(codePostal);
    count++;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(__dirname + '/../data/laposte_hexasmal.json')
      .pipe(JSONStream.parse('*'))
      .pipe(t((correspondance, enc, cb) => {
        // Exclusion de la polynésie
        if (correspondance.Code_commune_INSEE.indexOf('98') === 0) return cb();
        // Exclusion de Monaco
        if (correspondance.Code_commune_INSEE.indexOf('99') === 0) return cb();

        if (!(correspondance.Code_commune_INSEE in communes)) {
          if (correspondance.Nom_commune.toUpperCase().indexOf('PARIS') === 0) {
            addCodePostalToCommune(correspondance.Code_postal, '75056');
            return cb();
          }

          if (correspondance.Nom_commune.toUpperCase().indexOf('MARSEILLE') === 0) {
            addCodePostalToCommune(correspondance.Code_postal, '13055');
            return cb();
          }

          if (correspondance.Nom_commune.toUpperCase().indexOf('LYON') === 0) {
            addCodePostalToCommune(correspondance.Code_postal, '69123');
            return cb();
          }

          debug('Code INSEE non trouvé: %s (%s)', correspondance.Code_commune_INSEE, correspondance.Nom_commune);
          return cb();
        }

        addCodePostalToCommune(correspondance.Code_postal, correspondance.Code_commune_INSEE);
        cb();
      }))
      .on('error', reject)
      .on('finish', () => {
        debug('total des codes postaux chargés : %d', count);
        resolve();
      });
  });
}

module.exports = function () {
  return loadCommunes().then(loadCodePostaux).then(() => ({
    query: (lon, lat) => {
      const result = index.query(lon, lat);
      return result ? [result] : [];
    },
    queryByName: nom => textIndex.search(nom).map(result => {
      const commune = communes[result.ref];
      commune._score = result.score;
      return commune;
    }),
    queryByCP: codePostal => {
      if (cpIndex.has(codePostal)) {
        return cpIndex.get(codePostal);
      } else {
        return [];
      }
    }
  }));
};
