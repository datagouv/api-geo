const fs = require('fs');
const parse = require('csv-parse');
const t = require('through2').obj;
const iconv = require('iconv-lite');
const JSONStream = require('JSONStream');
const streamify = require('stream-array');

/* Initialisation */
function init(ctx, next) {
  ctx.regions = new Map();

  ctx.getRegion = (code) => {
    if (!ctx.regions.has(code)) {
      const region = { code };
      ctx.regions.set(code, region);
    }
    return ctx.regions.get(code);
  };

  next();
}

/* Chargement des régions */
function loadRegions(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données insee_cog_depts2016 ');
    let count = 0;

    fs.createReadStream(options.srcPath || __dirname + '/../../data/insee_cog_reg2016.tsv')
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({ delimiter: '\t', columns: true }))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.REGION;
        const region = ctx.getRegion(code);
        region.nom = data.NCCENR;
        count++;
        cb();
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de régions chargées : %d', count);
        next();
      });
  };
}

/* Sérialisation */
function serialize(options = {}) {
  return function (ctx, next) {
    ctx.debug('Sérialisation des données');
    let count = 0;

    if (ctx.regions.size < 1) {
      return next(new Error('No regions'));
    } else {
      streamify(Array.from(ctx.regions.values()))
        .on('error', next)
        .pipe(t((dep, enc, cb) => {
          count++;
          cb(null, dep);
        }))
        .on('error', next)
        .pipe(JSONStream.stringify())
        .on('error', next)
        .pipe(fs.createWriteStream(options.destPath || __dirname + '/../../data/regions.json'))
        .on('error', next)
        .on('finish', () => {
          ctx.debug('Nombre de régions écrits : %d', count);
          next();
        });
    }
  };
}

/* Exports */
module.exports = { init, serialize, loadRegions };
