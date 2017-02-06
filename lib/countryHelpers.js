const { initFields } = require('./helpers');

const initCountryFields = initFields({
  default: ['nom', 'code', 'iso2', 'iso3', 'num', 'territories'],
  base: ['nom', 'code'],
});

module.exports = { initCountryFields };
