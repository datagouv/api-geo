const { pick } = require('lodash');

function initCommuneFields(req, res, next) {
  if (req.query.fields) {
    req.fields = new Set(req.query.fields.split(','));
  } else {
    req.fields = new Set(['nom', 'code', 'codesPostaux', 'centre', 'surface']);
  }
  req.fields.add('code');
  req.fields.add('nom');
  next();
}

function initCommuneFormat(req, res, next) {
  req.outputFormat = ['json', 'geojson'].includes(req.query.format) ? req.query.format : 'json';
  if (req.outputFormat === 'geojson') {
    req.fields.delete('contour');
    req.fields.delete('centre');
  }
  next();
}

function formatCommune(req, commune) {
  if (req.outputFormat === 'geojson') {
    const geom = ['contour', 'centre'].includes(req.query.geometry) ? req.query.geometry : 'centre';
    return {
      type: 'Feature',
      properties: pick(commune, Array.from(req.fields)),
      geometry: commune[geom],
    };
  } else {
    return pick(commune, Array.from(req.fields));
  }
}

module.exports = { initCommuneFields, initCommuneFormat, formatCommune };
