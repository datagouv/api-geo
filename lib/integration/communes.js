const fs = require('fs');
const centroid = require('turf-centroid');
const union = require('turf-union');
const feature = require('turf-feature');
const JSONStream = require('JSONStream');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const streamify = require('stream-array');
const { omit } = require('lodash');


const communesMortesPourLaFrance = ['55189', '55039', '55050', '55239', '55307', '55139'];

function ignoreCommune(code) {
  return [
    '98', // Polynésie
    '99', // Monaco
    '975', // Saint-Pierre-et-Miquelon
    '978', // Saint-Martin
    '977', // Saint-Barthelemy
  ].some(prefix => code.indexOf(prefix) === 0);
}

/* Initialisation */
function init(ctx, next) {
  ctx.communes = new Map();

  ctx.createCommune = (code) => {
    if (ctx.communes.has(code)) throw new Error('La commune est déjà dans le référentiel');
    const commune = { code, codesPostaux: new Set(), communesMembres: new Set() };
    ctx.communes.set(code, commune);
    return commune;
  };

  ctx.getCommune = (code) => {
    if (!ctx.communes.has(code)) {
      throw new Error(`La commune ${code} n'est pas présente dans le référentiel`);
    }
    return ctx.communes.get(code);
  };

  ctx.getOrCreateCommune = (code) => {
    if (!ctx.hasCommune(code)) ctx.createCommune(code);
    return ctx.getCommune(code);
  };

  ctx.getCommuneActuelle = (code) => {
    const commune = ctx.getCommune(code);
    if (commune.ancienne && !commune.communeRattachement)
      throw new Error('Ancienne commune sans commune de rattachement');
    return commune.communeRattachement ? commune.communeRattachement : commune;
  };

  ctx.hasCommune = (code) => {
    return ctx.communes.has(code);
  };

  next();
}

/* Chargement des communes */
function loadCommunes(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données insee_cog_france2016 ');
    let count = 0;

    fs.createReadStream(options.srcPath || __dirname + '/../../data/insee_cog_france2016.tsv')
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        if (!['1', '2', '3', '6'].includes(data.ACTUAL)) return cb();
        if (data.ACTUAL === '3' && !data.POLE) return cb();
        const code = data.DEP + data.COM;
        if (ignoreCommune(code)) return cb();
        const commune = ctx.getOrCreateCommune(code);
        if (data.ACTUAL === '1') {
          commune.codeRegion = data.REG;
          commune.codeDepartement = data.DEP;
        } else {
          commune.ancienne = true;
          const communeRattachement = ctx.getOrCreateCommune(data.POLE);
          commune.communeRattachement = communeRattachement;
          communeRattachement.communesMembres.add(commune);
        }
        if (communesMortesPourLaFrance.includes(code)) {
          commune.mortePourLaFrance = true;
        }
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
        if (!ctx.hasCommune(code)) {
          ctx.debug(`géométries : commune ${communeFeature.properties.nom} (${code}) introuvable => ignorée`);
          return cb();
        }
        const commune = ctx.getCommune(code);

        if (commune.contour) {
          ctx.debug(`géométries : polygone déjà présent pour ${commune.nom} (${commune.code}) => fusionné`);
          commune.contour = union(feature(commune.contour), feature(communeFeature.geometry)).geometry;
          commune.surface = commune.surface + communeFeature.properties.surf_ha;
        } else {
          commune.contour = communeFeature.geometry;
          commune.surface = communeFeature.properties.surf_ha;
        }

        // commune.nom = communeFeature.properties.nom;
        commune.centre = centroid(feature(commune.contour)).geometry;
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

        if (!ctx.hasCommune(code)) {
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

        ctx.getCommuneActuelle(code).codesPostaux.add(codePostal);
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

/* Population */
function loadPopulation(options = {}) {
  if (!options.srcPath) throw new Error('srcPath is required');

  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données ' + options.srcPath);
    let count = 0;

    fs.createReadStream(options.srcPath)
      .on('error', next)
      .pipe(parse({ delimiter: ';', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.DEPCOM;
        if (!code || !data.PMUN13) return cb();
        const population = Number.parseInt(data.PMUN13, 10);
        if (!population) return cb();
        if (ignoreCommune(code)) return cb();
        if (!ctx.hasCommune(code)) {
          ctx.debug('population: commune non trouvée => %s (%s)', code, data.LIBMIN);
          return cb();
        }
        ctx.getCommune(code).population = population;
        count++;
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de populations chargées : %d', count);
        next();
      });
  };
}

/* Agrégation */
function aggregate() {
  return (ctx, next) => {
    ctx.debug('Agrégation des communes nouvelles');
    ctx.communes.forEach(commune => {
      if (!commune.ancienne && commune.communesMembres.size > 0) {
        /* Contours */
        const communeContours = [];
        commune.communesMembres.forEach(communeMembre => {
          if (communeMembre.contour) communeContours.push(communeMembre);
        });
        if (communeContours.length > 0) {
          if (commune.contour) communeContours.push(commune);
          ctx.debug('Commune nouvelle de %s (%s) : agrégation des contours', commune.nom.toUpperCase(), commune.code);
          let unionContour;
          communeContours.forEach(c => {
            ctx.debug('  contour de %s (%s)', c.nom.toUpperCase(), c.code);
            if (!unionContour) {
              unionContour = c.contour;
            } else {
              unionContour = union(feature(unionContour), feature(c.contour)).geometry;
            }
          });
          commune.contour = unionContour;
        }

        /* Population */
        const communePopulations = [];
        commune.communesMembres.forEach(communeMembre => {
          if (communeMembre.population) communePopulations.push(communeMembre);
        });
        if (communePopulations.length > 0) {
          if (commune.population) communePopulations.push(commune);
          ctx.debug('Commune nouvelle de %s (%s) : agrégation de la population', commune.nom.toUpperCase(), commune.code);
          let populationTotale = 0;
          communePopulations.forEach(c => {
            ctx.debug('  population de %s (%s) : %d', c.nom.toUpperCase(), c.code, c.population);
            populationTotale += c.population;
          });
          commune.population = populationTotale;
        }
      }
    });
    next();
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
          if (commune.ancienne) return cb();
          commune.codesPostaux = Array.from(commune.codesPostaux);
          count++;
          cb(null, omit(commune, 'communeMembre', 'communeRattachement', 'ancienne'));
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
      if (!commune.ancienne) {
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
        if (!commune.population && !commune.mortePourLaFrance) {
          ctx.debug(`${commune.nom} (${commune.code}) n'a pas de population!`);
        }
        if (!valid) {
          count++;
          ctx.communes.delete(commune.code);
        }
      }
    }
    ctx.debug('Nombre de communes délictueuses : %d', count);
    next();
  };
}

/* Exports */
module.exports = { init, loadCommunes, loadGeometries, loadCodePostaux, loadPopulation, serialize, aggregate, checkCommunes };
