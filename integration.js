/* eslint no-console: ["off"] */
const JSONStream = require('JSONStream');
const t = require('through2').obj;
const fs = require('fs');
const debug = require('debug')('integration');
const centroid = require('turf-centroid');
const streamify = require('stream-array');

const communes = new Map();

function getByCodeInsee(codeInsee) {
  if (!communes.has(codeInsee)) {
    const commune = { codeInsee, codesPostaux: new Set() };
    communes.set(codeInsee, commune);
  }
  return communes.get(codeInsee);
}

function loadCommunes(filePath) {
  debug('Chargement du jeu de données communes-dp25 (géométries + noms)');
  let count = 0;
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(JSONStream.parse('features.*'))
      .pipe(t((communeFeature, enc, cb) => {
        const codeInsee = communeFeature.properties.insee;
        const commune = getByCodeInsee(codeInsee);

        commune.nom = communeFeature.properties.nom;
        commune.contour = communeFeature.geometry;
        commune.centre = centroid(communeFeature).geometry;
        commune.surface = communeFeature.properties.surf_ha;

        count++;
        cb();
      }))
      .on('error', reject)
      .on('finish', () => {
        debug('Nombre de géométries chargées : %d', count);
        resolve();
      });
  });
}

function loadCodePostaux() {
  debug('Chargement du jeu de données hexasmal (codes postaux)');
  let count = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(__dirname + '/data/laposte_hexasmal.json')
      .pipe(JSONStream.parse('*'))
      .pipe(t((correspondance, enc, cb) => {
        let codeInsee = correspondance.Code_commune_INSEE;
        const codePostal = correspondance.Code_postal;
        const nom = correspondance.Nom_commune;

        // Exclusion de la polynésie
        if (codeInsee.indexOf('98') === 0) return cb();
        // Exclusion de Monaco
        if (codeInsee.indexOf('99') === 0) return cb();

        if (!communes.has(codeInsee)) {
          if (nom.toUpperCase().indexOf('PARIS') === 0) {
            codeInsee = '75056';
          }

          if (nom.toUpperCase().indexOf('MARSEILLE') === 0) {
            codeInsee = '13055';
          }

          if (nom.toUpperCase().indexOf('LYON') === 0) {
            codeInsee = '69123';
          }
        }

        if (!communes.has(codeInsee)) {
          debug('Code INSEE non trouvé: %s (%s)', codeInsee, nom);
          return cb();
        }

        getByCodeInsee(codeInsee).codesPostaux.add(codePostal);
        count++;

        cb();
      }))
      .on('error', reject)
      .on('finish', () => {
        debug('Nombre de correspondances chargées : %d', count);
        resolve();
      });
  });
}

function serialize() {
  let count = 0;
  return new Promise((resolve, reject) => {
    streamify(Array.from(communes.values()))
      .on('error', reject)
      .pipe(t((commune, enc, cb) => {
        commune.codesPostaux = Array.from(commune.codesPostaux);
        count++;
        cb(null, commune);
      }))
      .on('error', reject)
      .pipe(JSONStream.stringify())
      .on('error', reject)
      .pipe(fs.createWriteStream(__dirname + '/data/communes.json'))
      .on('error', reject)
      .on('finish', () => {
        debug('Nombre de communes écrites : %d', count);
        resolve();
      });
  });
}

const filePath = __dirname + '/data/communes-dp25.json';

loadCommunes(filePath)
  .then(loadCodePostaux)
  .then(serialize)
  .then(() => debug('Terminé !'))
  .catch(console.error);
