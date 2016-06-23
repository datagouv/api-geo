const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initCommuneFields, initCommuneFormat } = require('./lib/communeHelpers');
const { initDepartementFields } = require('./lib/departementHelpers');
const { initRegionFields } = require('./lib/regionHelpers');
const { formatOne } = require('./lib/helpers');
const dbCommunes = require('./lib/communes').getIndexedDb();
const dbDepartements = require('./lib/departements').getIndexedDb();
const dbRegions = require('./lib/regions').getIndexedDb();
const { pick } = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs');

const openAPIDefinition = yaml.safeLoad(fs.readFileSync(__dirname + '/definition.yml', 'utf8'));

const app = express();
app.use(cors());
app.use(morgan('dev'));

// Inject databases references
app.use((req, res, next) => {
  req.db = {
    communes: dbCommunes,
    departements: dbDepartements,
    regions: dbRegions,
  };
  next();
});

/* Communes */
app.get('/communes', initCommuneFields, initCommuneFormat, function (req, res) {
  let result;

  const query = pick(req.query, 'code', 'codePostal', 'nom', 'codeDepartement', 'codeRegion', 'boost');
  if (req.query.lat && req.query.lon) {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (Number.isFinite(lat)
      && lat >= -90
      && lat <= 90
      && Number.isFinite(lon)
      && lon >= -180
      && lon <= 180
    ) {
      query.lat = lat;
      query.lon = lon;
    }
  }
  if (query.nom) req.fields.add('_score');

  if (Object.keys(query).length === 0) {
    return res.sendStatus(400);
  }

  result = dbCommunes.search(query);

  if (req.outputFormat === 'geojson') {
    res.send({
      type: 'FeatureCollection',
      features: result.map(commune => formatOne(req, commune)),
    });
  } else {
    res.send(result.map(commune => formatOne(req, commune)));
  }
});

app.get('/communes/:code', initCommuneFields, initCommuneFormat, function (req, res) {
  const communes = dbCommunes.queryByCode(req.params.code);
  if (communes.length === 0) {
    res.sendStatus(404);
  } else {
    res.send(formatOne(req, communes[0]));
  }
});

/* Départements */
app.get('/departements', initDepartementFields, function (req, res) {
  const query = pick(req.query, 'code', 'nom', 'codeRegion');

  if (query.nom) req.fields.add('_score');

  res.send(
    dbDepartements
      .search(query)
      .map(departement => formatOne(req, departement))
  );
});

app.get('/departements/:code', initDepartementFields, function (req, res) {
  const departements = dbDepartements.queryByCode(req.params.code);
  if (departements.length === 0) {
    res.sendStatus(404);
  } else {
    res.send(formatOne(req, departements[0]));
  }
});

app.get('/departements/:code/communes',  initCommuneFields, initCommuneFormat, function (req, res) {
  const departements = dbDepartements.queryByCode(req.params.code);
  if (departements.length === 0) {
    res.sendStatus(404);
  } else {
    const communes = dbCommunes.queryByDep(req.params.code);
    if (req.outputFormat === 'geojson') {
      res.send({
        type: 'FeatureCollection',
        features: communes.map(commune => formatOne(req, commune)),
      });
    } else {
      res.send(communes.map(commune => formatOne(req, commune)));
    }
  }
});


/* Régions */
app.get('/regions', initRegionFields, function (req, res) {
  const query = pick(req.query, 'code', 'nom', 'codeRegion');

  if (query.nom) req.fields.add('_score');

  res.send(
    dbRegions
      .search(query)
      .map(region => formatOne(req, region))
  );
});

app.get('/regions/:code', initRegionFields, function (req, res) {
  const regions = dbRegions.queryByCode(req.params.code);
  if (regions.length === 0) {
    res.sendStatus(404);
  } else {
    res.send(formatOne(req, regions[0]));
  }
});

app.get('/regions/:code/departements',  initDepartementFields, function (req, res) {
  const regions = dbRegions.queryByCode(req.params.code);
  if (regions.length === 0) {
    res.sendStatus(404);
  } else {
    const departements = dbDepartements.queryByCodeRegion(req.params.code);
    res.send(departements.map(commune => formatOne(req, commune)));
  }
});

/* Definition */
app.get('/definition.yml', function (req, res) {
  res.sendFile(__dirname + '/definition.yml');
});

app.get('/definition.json', function (req, res) {
  res.send(openAPIDefinition);
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  /* eslint no-console: 0 */
  console.log('Start listening on port %d', port);
});

module.exports = app;
