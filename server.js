const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pick } = require('lodash');

function initCommuneFields(req, res, next) {
  if (req.query.fields) {
    req.fields = new Set(req.query.fields.split(','));
  } else {
    req.fields = new Set(['nom', 'codeInsee', 'codesPostaux', 'centre', 'surface']);
  }
  req.fields.add('codeInsee', 'nom');
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

require('./lib/communeStore')()
  .then(db => {
    const app = express();
    app.use(cors());
    app.use(morgan('dev'));

    app.get('/communes', initCommuneFields, initCommuneFormat, function (req, res) {
      let result;

      if (req.query.lat && req.query.lon) {
        result = db.query([parseFloat(req.query.lon), parseFloat(req.query.lat)]);
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

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      /* eslint no-console: 0 */
      console.log('Start listening on port %d', port);
    });
  });
