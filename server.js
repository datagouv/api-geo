const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const {initCommuneFields, initCommuneFormat, communesDefaultQuery} = require('./lib/communeHelpers')
const {initCommunesAssocieeDelegueeFields, initCommuneAssocieeDelegueeFormat, communesAssocieesDelegueesDefaultQuery} = require('./lib/communeAssocieesDelegueesHelpers')
const {initEpciFields, initEpciFormat, epciDefaultQuery} = require('./lib/epciHelpers')
const {initDepartementFields, departementsDefaultQuery} = require('./lib/departementHelpers')
const {initRegionFields, regionsDefaultQuery} = require('./lib/regionHelpers')
const {formatOne, initLimit} = require('./lib/helpers')
const dbCommunes = require('./lib/communes').getIndexedDb()
const dbCommunesAssocieesDeleguees = require('./lib/communesAssocieesDeleguees').getIndexedDb()
const dbEpci = require('./lib/epcis').getIndexedDb()
const dbDepartements = require('./lib/departements').getIndexedDb()
const dbRegions = require('./lib/regions').getIndexedDb()
const {pick} = require('lodash')

const app = express()
app.use(cors({origin: true}))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({tracing: true}),
      // Enable Express.js middleware tracing
      new Tracing.Integrations.Express({app})
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
  })
  app.use(Sentry.Handlers.requestHandler())
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler())
}

// Inject databases references
app.use((req, res, next) => {
  req.db = {
    communes: dbCommunes,
    communesAssocieesDeleguees: dbCommunesAssocieesDeleguees,
    dbEpci,
    departements: dbDepartements,
    regions: dbRegions
  }
  next()
})

/* Communes associées et déléguées */
app.get('/communes_associees_deleguees', initLimit(), initCommunesAssocieeDelegueeFields, initCommuneAssocieeDelegueeFormat, (req, res) => {
  const query = pick(req.query, 'type', 'code', 'nom', 'codeEpci', 'codeDepartement', 'codeRegion')
  if (req.query.lat && req.query.lon) {
    const lat = parseFloat(req.query.lat)
    const lon = parseFloat(req.query.lon)
    if (Number.isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      Number.isFinite(lon) &&
      lon >= -180 &&
      lon <= 180
    ) {
      query.pointInContour = [lon, lat]
    }
  }

  if (query.nom) {
    req.fields.add('_score')
  }

  if (Object.keys(query).length === 0 && (req.outputFormat === 'geojson' || req.fields.has('contour'))) {
    return res.sendStatus(400)
  }

  if (query.type) {
    query.type = query.type.split(',')
  }

  const result = req.applyLimit(dbCommunesAssocieesDeleguees.search({...communesAssocieesDelegueesDefaultQuery, ...query}))

  if (req.outputFormat === 'geojson') {
    res.send({
      type: 'FeatureCollection',
      features: result.map(commune => formatOne(req, commune))
    })
  } else {
    res.send(result.map(commune => formatOne(req, commune)))
  }
})

app.get('/communes_associees_deleguees/:code', initCommunesAssocieeDelegueeFields, initCommuneAssocieeDelegueeFormat, (req, res) => {
  const communes = dbCommunesAssocieesDeleguees.search({code: req.params.code})
  if (communes.length === 0) {
    res.sendStatus(404)
  } else {
    res.send(formatOne(req, communes[0]))
  }
})

/* Communes */
app.get('/communes', initLimit(), initCommuneFields, initCommuneFormat, (req, res) => {
  const query = pick(req.query, 'type', 'code', 'codePostal', 'nom', 'siren', 'deleguees', 'associees', 'codeEpci', 'codeDepartement', 'codeRegion', 'boost', 'zone')
  if (req.query.lat && req.query.lon) {
    const lat = parseFloat(req.query.lat)
    const lon = parseFloat(req.query.lon)
    if (Number.isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      Number.isFinite(lon) &&
      lon >= -180 &&
      lon <= 180
    ) {
      query.pointInContour = [lon, lat]
    }
  }

  if (query.nom) {
    req.fields.add('_score')
  }

  if (Object.keys(query).length === 0 && (req.outputFormat === 'geojson' || req.fields.has('contour'))) {
    return res.sendStatus(400)
  }

  if (query.type) {
    query.type = query.type.split(',')
  }

  if (query.zone) {
    query.zone = query.zone.split(',')
  }

  const result = req.applyLimit(dbCommunes.search({...communesDefaultQuery, ...query}))

  if (req.outputFormat === 'geojson') {
    res.send({
      type: 'FeatureCollection',
      features: result.map(commune => formatOne(req, commune))
    })
  } else {
    res.send(result.map(commune => formatOne(req, commune)))
  }
})

app.get('/communes/:code', initCommuneFields, initCommuneFormat, (req, res) => {
  const communes = dbCommunes.search({code: req.params.code})
  if (communes.length === 0) {
    res.sendStatus(404)
  } else {
    res.send(formatOne(req, communes[0]))
  }
})

/* EPCI */
app.get('/epcis', initLimit(), initEpciFields, initEpciFormat, (req, res) => {
  const query = pick(req.query, 'code', 'nom', 'codeEpci', 'codeDepartement', 'codeRegion', 'boost', 'zone')

  if (query.nom) {
    req.fields.add('_score')
  }

  if (Object.keys(query).length === 0 && (req.outputFormat === 'geojson' || req.fields.has('contour'))) {
    return res.sendStatus(400)
  }

  if (query.zone) {
    query.zone = query.zone.split(',')
  }

  const result = req.applyLimit(dbEpci.search({...epciDefaultQuery, ...query}))

  if (req.outputFormat === 'geojson') {
    res.send({
      type: 'FeatureCollection',
      features: result.map(commune => formatOne(req, commune))
    })
  } else {
    res.send(result.map(commune => formatOne(req, commune)))
  }
})

app.get('/epcis/:code', initEpciFields, initEpciFormat, (req, res) => {
  const epci = dbEpci.search({code: req.params.code})
  if (epci.length === 0) {
    res.sendStatus(404)
  } else {
    res.send(formatOne(req, epci[0]))
  }
})

app.get('/epcis/:code/communes', initLimit(), initCommuneFields, initCommuneFormat, (req, res) => {
  const epcis = dbEpci.search({code: req.params.code})
  if (epcis.length === 0) {
    res.sendStatus(404)
  } else {
    const communes = req.applyLimit(dbCommunes.search({...communesDefaultQuery, codeEpci: req.params.code}))
    if (req.outputFormat === 'geojson') {
      res.send({
        type: 'FeatureCollection',
        features: communes.map(commune => formatOne(req, commune))
      })
    } else {
      res.send(communes.map(commune => formatOne(req, commune)))
    }
  }
})

/* Départements */
app.get('/departements', initLimit(), initDepartementFields, (req, res) => {
  const query = pick(req.query, 'code', 'nom', 'codeRegion', 'zone')

  if (query.nom) {
    req.fields.add('_score')
  }

  if (query.zone) {
    query.zone = query.zone.split(',')
  }

  res.send(
    req.applyLimit(dbDepartements.search({...departementsDefaultQuery, ...query}))
      .map(departement => formatOne(req, departement))
  )
})

app.get('/departements/:code', initDepartementFields, (req, res) => {
  const departements = dbDepartements.search({code: req.params.code})
  if (departements.length === 0) {
    res.sendStatus(404)
  } else {
    res.send(formatOne(req, departements[0]))
  }
})

app.get('/departements/:code/communes', initLimit(), initCommuneFields, initCommuneFormat, (req, res) => {
  const departements = dbDepartements.search({code: req.params.code})
  if (departements.length === 0) {
    res.sendStatus(404)
  } else {
    const communes = req.applyLimit(dbCommunes.search({...communesDefaultQuery, codeDepartement: req.params.code}))
    if (req.outputFormat === 'geojson') {
      res.send({
        type: 'FeatureCollection',
        features: communes.map(commune => formatOne(req, commune))
      })
    } else {
      res.send(communes.map(commune => formatOne(req, commune)))
    }
  }
})

/* Régions */
app.get('/regions', initLimit(), initRegionFields, (req, res) => {
  const query = pick(req.query, 'code', 'nom', 'zone')

  if (query.nom) {
    req.fields.add('_score')
  }

  if (query.zone) {
    query.zone = query.zone.split(',')
  }

  res.send(
    req.applyLimit(dbRegions.search({...regionsDefaultQuery, ...query}))
      .map(region => formatOne(req, region))
  )
})

app.get('/regions/:code', initRegionFields, (req, res) => {
  const regions = dbRegions.search({code: req.params.code})
  if (regions.length === 0) {
    res.sendStatus(404)
  } else {
    res.send(formatOne(req, regions[0]))
  }
})

app.get('/regions/:code/departements', initLimit(), initDepartementFields, (req, res) => {
  const regions = dbRegions.search({code: req.params.code})
  if (regions.length === 0) {
    res.sendStatus(404)
  } else {
    const departements = req.applyLimit(dbDepartements.search({codeRegion: req.params.code}))
    res.send(departements.map(commune => formatOne(req, commune)))
  }
})

/* Raw data */
app.get('/raw/communes.json', (req, res) => {
  res.download('data/communes.json')
})

app.get('/raw/departements.json', (req, res) => {
  res.download('data/departements.json')
})

app.get('/raw/regions.json', (req, res) => {
  res.download('data/regions.json')
})

/* Definition */
app.get('/definition.yml', (req, res) => {
  res.sendFile(__dirname + '/definition.yml')
})

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}

const port = process.env.PORT || 5000

app.listen(port, () => {
  /* eslint no-console: 0 */
  console.log('Start listening on port %d', port)
})

module.exports = app
