const { pick, take } = require('lodash');

function initFields(options = {}) {
  if (!options.default || !options.base) throw new Error('Options default and base are required');

  return (req, res, next) => {
    if (req.query.fields) {
      req.fields = new Set(req.query.fields.split(','));
    } else {
      req.fields = new Set(options.default);
    }
    options.base.forEach(field => req.fields.add(field));
    next();
  };
}

function initLimit() {
  return (req, res, next) => {
    if (!req.query.limit) {
      req.applyLimit = list => list;
    } else {
      const limit = parseInt(req.query.limit);
      if (!Number.isInteger(limit) || limit < 0) {
        return res.sendStatus(400);
      }
      req.applyLimit = list => take(list, limit);
    }
    next();
  };
}

function initFormat(options = {}) {
  if (options.geometries && !options.defaultGeometry) throw new Error('defaultGeometry is required');
  if (options.defaultGeometry && !options.geometries.includes(options.defaultGeometry))
    throw new Error('defaultGeometry is not in geometry list');
  const acceptedFormats = ['json'];
  if (options.geometries) acceptedFormats.push('geojson');

  return (req, res, next) => {
    req.outputFormat = acceptedFormats.includes(req.query.format) ? req.query.format : 'json';
    if (req.outputFormat === 'geojson') {
      req.geometries = options.geometries;
      req.defaultGeometry = options.defaultGeometry;
      options.geometries.forEach(geometry => req.fields.delete(geometry));
    }
    next();
  };
}

function formatOne(req, target) {
  const properties = pick(target, Array.from(req.fields));

  if (target.codeDepartement && req.fields.has('departement')) {
    const departement = req.db.departements.search({ code: target.codeDepartement })[0];
    properties.departement = pick(departement, 'code', 'nom');
  }

  if (target.codeRegion && req.fields.has('region')) {
    const region = req.db.regions.search({ code: target.codeRegion })[0];
    properties.region = pick(region, 'code', 'nom');
  }

  if (req.outputFormat === 'geojson') {
    const geom = req.geometries.includes(req.query.geometry) ? req.query.geometry : req.defaultGeometry;
    return {
      type: 'Feature',
      properties,
      geometry: target[geom],
    };
  } else {
    return properties;
  }
}

module.exports = { initLimit, initFields, initFormat, formatOne };
