const departements = require('./departements');
const communes = require('./communes');
const regions = require('./regions');
const pipeline = require('./pipeline');

/* Pipeline */
function integrate(done) {
  pipeline([
    // Communes
    communes.init,
    communes.loadCommunes(),
    communes.loadCodePostaux(),
    communes.serialize(),
    // Départements
    departements.init,
    departements.loadDepartements(),
    departements.serialize(),
    // Régions
    regions.init,
    regions.loadRegions(),
    regions.serialize(),
  ], done);
}

/* Exports */
module.exports = { integrate };
