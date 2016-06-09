const fs = require('fs');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const JSONStream = require('JSONStream');
const streamify = require('stream-array');

/* Initialisation */
function init(ctx, next) {
  ctx.departements = new Map();

  ctx.getDepartement = (code) => {
    if (!ctx.departements.has(code)) {
      const departement = { code };
      ctx.departements.set(code, departement);
    }
    return ctx.departements.get(code);
  };

  next();
}

/* Chargement des départements */
function loadDepartements(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données insee_cog_depts2016 ');
    let count = 0;

    fs.createReadStream(options.srcPath || __dirname + '/../../data/insee_cog_depts2016.tsv')
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true } ))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.DEP;
        const departement = ctx.getDepartement(code);
        departement.codeRegion = data.REGION;
        departement.nom = data.NCCENR;
        count++;
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de départements chargées : %d', count);
        next();
      });
  };
}

/* Sérialisation */
function serialize(options = {}) {
  return function (ctx, next) {
    ctx.debug('Sérialisation des données');
    let count = 0;

    if (ctx.departements.size < 1) {
      return next(new Error('No departements'));
    } else {
      streamify(Array.from(ctx.departements.values()))
        .on('error', next)
        .pipe(JSONStream.stringify())
        .on('error', next)
        .pipe(fs.createWriteStream(options.destPath || __dirname + '/../../data/departements.json'))
        .on('error', next)
        .on('finish', () => {
          ctx.debug('Nombre de departements écrits : %d', count);
          next();
        });
    }
  };
}

/* Exports */
module.exports = { init, serialize, loadDepartements };
