const { pick } = require('lodash');

function initCommuneFields(req, res, next) {
  if (req.query.fields) {
    req.fields = new Set(req.query.fields.split(','));
  } else {
    req.fields = new Set(['nom', 'codeInsee', 'codesPostaux', 'centre', 'surface']);
  }
  req.fields.add('codeInsee');
  req.fields.add('nom');
  next();
}

function initCommuneFormat(req, res, next) {
  req.outputFormat = ['json', 'geojson'].indexOf(req.query.format) >= 0 ? req.query.format : 'json';
  if (req.outputFormat === 'geojson') {
    req.fields.delete('contour');
    req.fields.delete('centre');
  }
  next();
}

function formatCommune(req, commune) {
  if (req.outputFormat === 'geojson') {
    const geom = ['contour', 'centre'].indexOf(req.query.geometry) >= 0 ? req.query.geometry : 'centre';
    return {
      type: 'Feature',
      properties: pick(commune, Array.from(req.fields)),
      geometry: commune[geom]
    };
  } else {
    return pick(commune, Array.from(req.fields));
  }
}

module.exports = { initCommuneFields, initCommuneFormat, formatCommune };
