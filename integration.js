/* eslint no-console: ["off"] */
const integrate = require('./lib/integrate').integration;
const debug = require('debug')('integrate');

const communeFilePath = __dirname + '/data/communes-dp25.json';
const codesPostauxFilePath = __dirname + '/data/laposte_hexasmal.json';
const serialiseDestination = __dirname + '/data/communes.json';

const integration = integrate(communeFilePath, codesPostauxFilePath, serialiseDestination);
integration.loadCommunes()
  .then(integration.loadCodePostaux)
  .then(integration.serialize)
  .then(() => debug('Terminé !'))
  .catch(console.error);
