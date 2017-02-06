const fs = require('fs');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const JSONStream = require('JSONStream');
const streamify = require('stream-array');

/* Initialisation */
function init(ctx, next) {
  ctx.countries = new Map();

  ctx.getCountry = (code) => {
    if (!ctx.countries.has(code)) {
      const country = { code, territories: new Set() };
      ctx.countries.set(code, country);
    }
    return ctx.countries.get(code);
  };

  next();
}

/* Chargement des territoires */
function loadTerritories(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données pays2016 ');
    let count = 0;
    const srcPath = options.srcPath || __dirname + '/../../forced_data/pays2016.tsv';

    fs.createReadStream(srcPath)
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.COG;
        if (data.ACTUAL === '3') {
          const territory = {
            nom: data.LIBCOG,
            iso2: data.CODEISO2,
            iso3: data.CODEISO2,
            num: data.CODENUM3,
          };
          ctx.getCountry(code).territories.add(territory);
          count++;
        }
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de territoires chargées : %d', count);
        next();
      });
  };
}

/* Chargement des pays */
function loadCountries(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données pays2016 ');
    let count = 0;
    const srcPath = options.srcPath || __dirname + '/../../forced_data/pays2016.tsv';

    fs.createReadStream(srcPath)
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.COG;
        if (code !== 'XXXXX' && data.ACTUAL !== '3') {
          const country = ctx.getCountry(code);
          country.nom = data.LIBCOG;
          country.iso2 = data.CODEISO2;
          country.iso3 = data.CODEISO3;
          country.num = data.CODENUM3;
          count++;
        }
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de pays chargées : %d', count);
        next();
      });
  };
}

/* Sérialisation */
function serialize(options = {}) {
  return function (ctx, next) {
    ctx.debug('Sérialisation des données');
    let count = 0;

    if (ctx.countries.size < 1) {
      return next(new Error('No country'));
    } else {
      streamify(Array.from(ctx.countries.values()))
        .on('error', next)
        .pipe(t((country, enc, cb) => {
          country.territories = Array.from(country.territories).sort();
          count++;
          cb(null, country);
        }))
        .on('error', next)
        .pipe(JSONStream.stringify())
        .on('error', next)
        .pipe(fs.createWriteStream(options.destPath || __dirname + '/../../data/countries.json'))
        .on('error', next)
        .on('finish', () => {
          ctx.debug('Nombre de pays écrits : %d', count);
          next();
        });
    }
  };
}

/* Exports */
module.exports = { init, serialize, loadCountries, loadTerritories };
