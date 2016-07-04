const fs = require('fs');
const centroid = require('turf-centroid');
const union = require('turf-union');
const feature = require('turf-feature');
const JSONStream = require('JSONStream');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const streamify = require('stream-array');
const { forEach, pick } = require('lodash');


const communesMortesPourLaFrance = ['55189', '55039', '55050', '55239', '55307', '55139'];

function isIgnoredCommune(code) {
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
    const commune = { code, codesPostaux: new Set(), communesMembres: new Set(), tags: new Set() };
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
    if (commune.tags.has('actuelle')) return commune;
    if (commune.tags.has('arrondissement-municipal')) return commune;
    if (!commune.communeRattachement)
      throw new Error('Ancienne commune sans commune de rattachement');
    return commune.communeRattachement;
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

    fs.createReadStream(options.srcPath || __dirname + '/../../data/insee_cog_france2016.tsv')
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        if (!data.ACTUAL) return cb();
        const code = data.DEP + data.COM;
        if (!code) return cb();
        if (isIgnoredCommune(code)) return cb();

        const TYPES = {
          actuelle: '1',
          associee: '2',
          perimee: '3', // fusion simple ou disparition
          changementCode: '4',
          arrondissementMunicipal: '5',
          deleguee: '6',
          fractionCantonale: '9',
        };

        if (data.ACTUAL === TYPES.changementCode) return cb();
        if (data.ACTUAL === TYPES.fractionCantonale) return cb();
        if (data.ACTUAL === TYPES.perimee && !data.POLE) return cb();

        const commune = ctx.getOrCreateCommune(code);
        let communeRattachement;

        if (data.ACTUAL === TYPES.actuelle) {
          commune.tags.add('actuelle');
        } else {
          communeRattachement = ctx.getOrCreateCommune(data.POLE);
          commune.communeRattachement = communeRattachement;
          communeRattachement.communesMembres.add(commune);
        }

        if ([TYPES.associee, TYPES.perimee, TYPES.deleguee].includes(data.ACTUAL)) {
          commune.tags.add('ancienne');
        }

        if (data.ACTUAL === TYPES.arrondissementMunicipal) {
          commune.tags.add('arrondissement-municipal');
          communeRattachement.tags.add('avec-arrondissements');
        }

        if (communesMortesPourLaFrance.includes(code)) {
          commune.tags.add('morte-pour-la-france');
        }

        commune.nom = data.NCCENR;
        commune.codeRegion = data.REG;
        commune.codeDepartement = data.DEP;
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de communes chargées : %d', ctx.communes.size);
        next();
      });
  };
}

/* Chargement des contours */
function loadGeometries(options = {}) {
  if (!options.srcPath) throw new Error('srcPath is required');

  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données communes-dp25 (géométries + noms)');
    let count = 0;

    fs.createReadStream(options.srcPath)
      .on('error', next)
      .pipe(JSONStream.parse('features.*'))
      .on('error', next)
      .pipe(t((communeFeature, enc, cb) => {
        const code = communeFeature.properties.insee;
        if (isIgnoredCommune(code)) return cb();
        if (!ctx.hasCommune(code)) {
          ctx.debug(`géométries : commune ${communeFeature.properties.nom} (${code}) introuvable => ignorée`);
          return cb();
        }
        const commune = ctx.getCommune(code);
        commune.contour = communeFeature.geometry;
        commune.surface = communeFeature.properties.surf_ha;
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
        const code = correspondance.Code_commune_INSEE;
        if (isIgnoredCommune(code)) return cb();

        const codePostal = correspondance.Code_postal;
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
        if (isIgnoredCommune(code)) return cb();
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
      if (commune.tags.has('actuelle') && commune.tags.has('sans-arrondissements') && commune.communesMembres.size > 0) {
        /* Contours */
        const communeContours = [];
        commune.communesMembres.forEach(communeMembre => {
          if (communeMembre.contour) communeContours.push(communeMembre);
        });
        if (communeContours.length > 0) {
          if (commune.contour) communeContours.push(commune);
          ctx.debug('Commune nouvelle de %s (%s) : agrégation des contours', commune.nom.toUpperCase(), commune.code);
          let unionContour;
          let surfaceTotale = 0;
          communeContours.forEach(c => {
            ctx.debug('  contour de %s (%s)', c.nom.toUpperCase(), c.code);
            if (!unionContour) {
              unionContour = c.contour;
            } else {
              unionContour = union(feature(unionContour), feature(c.contour)).geometry;
            }
            surfaceTotale += c.surface;
          });
          commune.contour = unionContour;
          commune.surface = surfaceTotale;
          commune.centre = centroid(feature(commune.contour)).geometry;
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
          // Current working implementation
          if (!commune.tags.has('actuelle')) return cb();

          if (commune.tags.has('actuelle') && !commune.tags.has('avec-arrondissements')) {
            commune.tags.add('sans-arrondissements');
          }
          commune.codesPostaux = Array.from(commune.codesPostaux);
          commune.tags = Array.from(commune.tags);
          if (commune.communesMembres.size > 0) {
            commune.communesMembres = Array.from(commune.communesMembres).map(c => c.code);
          } else {
            commune.communesMembres = undefined;
          }
          if (commune.communeRattachement) {
            commune.communeRattachement = commune.communeRattachement.code;
          }
          count++;
          cb(null, pick(commune, 'nom', 'code', 'population', 'codesPostaux', 'centre', 'contour', 'codeDepartement', 'codeRegion', 'surface'));
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
      if (!commune.tags.has('ancienne')) {
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
        if (!commune.population && !commune.tags.has('morte-pour-la-france')) {
          ctx.debug(`${commune.nom} (${commune.code}) n'a pas de population!`);
        }
        if (!valid) {
          ctx.debug(Array.from(commune.tags));
          count++;
        }
      }
    }
    ctx.debug('Nombre de communes délictueuses : %d', count);
    next();
  };
}

/* Exports */
module.exports = { isIgnoredCommune, init, loadCommunes, loadGeometries, loadCodePostaux, loadPopulation, serialize, aggregate, checkCommunes };
