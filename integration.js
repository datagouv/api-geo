/* eslint no-console: ["off"] */
const { integrate } = require('./lib/integrate');
const debug = require('debug')('integration');

const integration = integrate();
integration.loadCommunes()
  .then(integration.loadCodePostaux)
  .then(integration.serialize)
  .then(() => debug('Terminé !'))
  .catch(console.error);
