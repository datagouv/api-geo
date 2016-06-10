const fs = require('fs');
const centroid = require('turf-centroid');
const JSONStream = require('JSONStream');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const streamify = require('stream-array');

/* Initialisation */
function init(ctx, next) {
  ctx.communes = new Map();

  ctx.getCommune = (codeInsee) => {
    if (!ctx.communes.has(codeInsee)) {
      const commune = { codeInsee, codesPostaux: new Set() };
      ctx.communes.set(codeInsee, commune);
    }
    return ctx.communes.get(codeInsee);
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
        ctx.debug('Nombre de communes (COG) chargées : %d', count);
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
        const codeInsee = communeFeature.properties.insee;
        const commune = ctx.getCommune(codeInsee);

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
        let codeInsee = correspondance.Code_commune_INSEE;
        const codePostal = correspondance.Code_postal;
        const nom = correspondance.Nom_commune;

        // Exclusion de la polynésie
        if (codeInsee.indexOf('98') === 0) return cb();
        // Exclusion de Monaco
        if (codeInsee.indexOf('99') === 0) return cb();

        if (!ctx.communes.has(codeInsee)) {
          if (nom.toUpperCase().indexOf('PARIS ') === 0) {
            codeInsee = '75056';
          } else if (nom.toUpperCase().indexOf('MARSEILLE ') === 0) {
            codeInsee = '13055';
          } else if (nom.toUpperCase().indexOf('LYON ') === 0) {
            codeInsee = '69123';
          } else {
            ctx.debug('Code INSEE non trouvé: %s (%s)', codeInsee, nom);
            return cb();
          }
        }

        ctx.getCommune(codeInsee).codesPostaux.add(codePostal);
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

/* Exports */
module.exports = { init, loadCommunes, loadGeometries, loadCodePostaux, serialize };
