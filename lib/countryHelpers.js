const { initFields } = require('./helpers');

const initCountryFields = initFields({
  default: ['nom', 'code', 'iso2', 'iso3', 'territories'],
  base: ['nom', 'code'],
});

module.exports = { initCountryFields };
