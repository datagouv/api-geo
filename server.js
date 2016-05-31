const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initCommuneFields, initCommuneFormat, formatCommune } = require('./lib/communeHelpers');
const db = require('./lib/db');

const app = express();
app.use(cors());
app.use(morgan('dev'));

app.get('/communes', initCommuneFields, initCommuneFormat, function (req, res) {
  let result;

  if (req.query.lat && req.query.lon) {
    result = db.queryByLonLat([parseFloat(req.query.lon), parseFloat(req.query.lat)]);
  } else if (req.query.nom) {
    req.fields.add('_score');
    result = db.queryByName(req.query.nom);
  } else if (req.query.codePostal) {
    result = db.queryByCP(req.query.codePostal);
  } else {
    return res.sendStatus(400);
  }

  if (req.outputFormat === 'geojson') {
    res.send({
      type: 'FeatureCollection',
      features: result.map(commune => formatCommune(req, commune))
    });
  } else {
    res.send(result.map(commune => formatCommune(req, commune)));
  }
});

app.get('/communes/:codeInsee', initCommuneFields, initCommuneFormat, function (req, res) {
  let commune = db.queryByCodeInsee(req.params.codeInsee);
  if (!commune) {
    res.sendStatus(404);
  } else {
    res.send(formatCommune(req, commune));
  }
});

app.get('/definition.yml', function (req, res) {
  res.sendFile(__dirname + '/definition.yml');
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  /* eslint no-console: 0 */
  console.log('Start listening on port %d', port);
});
