const fs = require('fs');
const centroid = require('turf-centroid');
const JSONStream = require('JSONStream');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const streamify = require('stream-array');

function ignoreCommune(code) {
  // Exclusion de la polynésie
  if (code.indexOf('98') === 0) return true;
  // Exclusion de Monaco
  if (code.indexOf('99') === 0) return true;
  // Exclusion de Saint-Pierre-et-Miquelon
  if (code.indexOf('975') === 0) return true;
  // Exclusion de Saint-Martin
  if (code.indexOf('978') === 0) return true;
  // Exclusion de Saint-Barthelemy
  if (code.indexOf('977') === 0) return true;
  return false;
}

/* Initialisation */
function init(ctx, next) {
  ctx.communes = new Map();

  ctx.getCommune = (code) => {
    if (!ctx.communes.has(code)) {
      const commune = { code, codesPostaux: new Set() };
      ctx.communes.set(code, commune);
    }
    return ctx.communes.get(code);
  };

  next();
}

/* Chargement des communes */
function loadCommunes(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données insee_cog_comsimp2016 ');
    let count = 0;

    fs.createReadStream(options.srcPath || __dirname + '/../../data/insee_cog_comsimp2016.tsv')
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.DEP + data.COM;
        const commune = ctx.getCommune(code);
        commune.codeRegion = data.REG;
        commune.codeDepartement = data.DEP;
        commune.nom = data.NCCENR;
        count++;
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de communes chargées : %d', count);
        next();
      });
  };
}

/* Chargement des communes */
function loadGeometries(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données communes-dp25 (géométries + noms)');
    let count = 0;

    fs.createReadStream(options.srcPath || __dirname + '/../../data/communes-dp25.json')
      .on('error', next)
      .pipe(JSONStream.parse('features.*'))
      .on('error', next)
      .pipe(t((communeFeature, enc, cb) => {
        const code = communeFeature.properties.insee;
        if (ignoreCommune(code)) return cb();
        const commune = ctx.getCommune(code);

        commune.nom = communeFeature.properties.nom;
        commune.contour = communeFeature.geometry;
        commune.centre = centroid(communeFeature).geometry;
        commune.surface = communeFeature.properties.surf_ha;

        count++;
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de géométries chargées : %d', count);
        next();
      });
  };
}

/* Chargement des codes postaux */
function loadCodePostaux(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données hexasmal (codes postaux)');
    let count = 0;

    fs.createReadStream(options.srcPath || __dirname + '/../../data/laposte_hexasmal.json')
      .on('error', next)
      .pipe(JSONStream.parse('*'))
      .on('error', next)
      .pipe(t((correspondance, enc, cb) => {
        let code = correspondance.Code_commune_INSEE;
        const codePostal = correspondance.Code_postal;
        const nom = correspondance.Nom_commune;

        if (ignoreCommune(code)) return cb();

        if (!ctx.communes.has(code)) {
          if (nom.toUpperCase().indexOf('PARIS ') === 0) {
            code = '75056';
          } else if (nom.toUpperCase().indexOf('MARSEILLE ') === 0) {
            code = '13055';
          } else if (nom.toUpperCase().indexOf('LYON ') === 0) {
            code = '69123';
          } else {
            ctx.debug('Code INSEE non trouvé: %s (%s)', code, nom);
            return cb();
          }
        }

        ctx.getCommune(code).codesPostaux.add(codePostal);
        count++;

        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de correspondances chargées : %d', count);
        next();
      });
  };
}

/* Sérialisation */
function serialize(options = {}) {
  return function (ctx, next) {
    ctx.debug('Sérialisation des données');
    let count = 0;

    if (ctx.communes.size < 1) {
      return next(new Error('No commune'));
    } else {
      streamify(Array.from(ctx.communes.values()))
        .on('error', next)
        .pipe(t((commune, enc, cb) => {
          commune.codesPostaux = Array.from(commune.codesPostaux);
          count++;
          cb(null, commune);
        }))
        .on('error', next)
        .pipe(JSONStream.stringify())
        .on('error', next)
        .pipe(fs.createWriteStream(options.destPath || __dirname + '/../../data/communes.json'))
        .on('error', next)
        .on('finish', () => {
          ctx.debug('Nombre de communes écrites : %d', count);
          next();
        });
    }
  };
}

/* Vérification de l'intégrité des communes chargées */
function checkCommunes() {
  return function (ctx, next) {
    ctx.debug('Validation des communes');
    let count = 0;

    for (let commune of ctx.communes.values()) {
      let valid = true;
      if (!commune.contour) {
        valid = false;
        ctx.debug(`${commune.nom} (${commune.code}) n'a pas de contours!`);
      }
      if (!commune.codesPostaux.size) {
        valid = false;
        ctx.debug(`${commune.nom} (${commune.code}) n'a pas de codes postaux!`);
      }
      if (!commune.codeDepartement) {
        valid = false;
        ctx.debug(`${commune.nom} (${commune.code}) n'a pas de code de département!`);
      }
      if (!valid) {
        count++;
        ctx.communes.delete(commune.code);
      }
    }
    ctx.debug('Nombre de communes délictueuses : %d', count);
    next();
  };
}

/* Exports */
module.exports = { init, loadCommunes, loadGeometries, loadCodePostaux, serialize, checkCommunes };
