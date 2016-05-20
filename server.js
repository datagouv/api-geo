const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');


require('./lib/communeStore')()
  .then(db => {
    const app = express();
    app.use(cors());
    app.use(morgan('dev'));

    app.get('/communes', function (req, res) {
      if (req.query.lat && req.query.lon) {
        res.send(_.pick(db.query([parseFloat(req.query.lon), parseFloat(req.query.lat)]), 'codeInsee', 'codesPostaux', 'nom', 'centre', 'surface'));
      } else if (req.query.nom) {
        res.send(db.queryByName(req.query.nom));
      } else if (req.query.codePostal) {
        res.send(db.queryByCP(req.query.codePostal));
      } else {
        return res.sendStatus(400);
      }
    });

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      /* eslint no-console: 0 */
      console.log('Start listening on port %d', port);
    });
  });
