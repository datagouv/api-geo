const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pick } = require('lodash');


require('./lib/communeStore')()
  .then(db => {
    const app = express();
    app.use(cors());
    app.use(morgan('dev'));

    app.get('/communes', function (req, res) {
      let result;
      let fields;
      if (req.query.fields) {
        fields = new Set(req.query.fields.split(','));
      } else {
        fields = new Set(['nom', 'codeInsee', 'codesPostaux', 'centre', 'surface']);
      }
      fields.add('codeInsee', 'nom');

      if (req.query.lat && req.query.lon) {
        result = db.query([parseFloat(req.query.lon), parseFloat(req.query.lat)]);
      } else if (req.query.nom) {
        fields.add('_score');
        result = db.queryByName(req.query.nom);
      } else if (req.query.codePostal) {
        result = db.queryByCP(req.query.codePostal);
      } else {
        return res.sendStatus(400);
      }

      if (result) {
        res.send(result.map(commune => pick(commune, Array.from(fields))));
      }
    });

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      /* eslint no-console: 0 */
      console.log('Start listening on port %d', port);
    });
  });
