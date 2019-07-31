const {pick, take} = require('lodash')

function initFields(options = {}) {
  if (!options.default || !options.base) {
    throw new Error('Options default and base are required')
  }

  return (req, res, next) => {
    if (req.query.fields) {
      req.fields = new Set(req.query.fields.split(','))
    } else {
      req.fields = new Set(options.default)
    }

    options.base.forEach(field => req.fields.add(field))
    next()
  }
}

function initLimit() {
  return (req, res, next) => {
    if (req.query.limit) {
      const limit = parseInt(req.query.limit, 10)
      if (!Number.isInteger(limit) || limit < 0) {
        return res.sendStatus(400)
      }

      req.applyLimit = list => take(list, limit)
    } else {
      req.applyLimit = list => list
    }

    next()
  }
}

function initFormat(options = {}) {
  const {geometries, defaultGeometry} = options

  if (geometries && !defaultGeometry) {
    throw new Error('defaultGeometry is required')
  }

  if (defaultGeometry && !geometries.includes(defaultGeometry)) {
    throw new Error('defaultGeometry is not in geometry list')
  }

  const acceptedFormats = ['json']
  if (geometries) {
    acceptedFormats.push('geojson')
  }

  return (req, res, next) => {
    req.outputFormat = acceptedFormats.includes(req.query.format) ? req.query.format : 'json'

    if (req.outputFormat === 'geojson') {
      req.geometry = geometries.includes(req.query.geometry) ? req.query.geometry : defaultGeometry

      geometries.forEach(geometry => req.fields.delete(geometry))
    }

    next()
  }
}

function formatOne(req, target) {
  const properties = pick(target, [...req.fields])

  if (target.codeDepartement && req.fields.has('departement')) {
    const departement = req.db.departements.search({code: target.codeDepartement})[0]
    properties.departement = pick(departement, 'code', 'nom')
  }

  if (target.codeRegion && req.fields.has('region')) {
    const region = req.db.regions.search({code: target.codeRegion})[0]
    properties.region = pick(region, 'code', 'nom')
  }

  if (req.outputFormat === 'geojson') {
    return {
      type: 'Feature',
      properties,
      geometry: target[req.geometry]
    }
  }

  return properties
}

module.exports = {initLimit, initFields, initFormat, formatOne}
