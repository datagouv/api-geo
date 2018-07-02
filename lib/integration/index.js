const departements = require('./departements')
const communes = require('./communes')
const regions = require('./regions')
const countries = require('./countries')
const pipeline = require('./pipeline')

/* Pipeline */
function integrate(done) {
  pipeline([
    // Communes
    communes.init,
    communes.loadCommunes(),
    communes.moreCommunes(),
    communes.loadGeometries(),
    communes.loadCodePostaux(),
    communes.loadPopulation({srcPath: __dirname + '/../../data/insee_population_metropole.csv'}),
    communes.loadPopulation({srcPath: __dirname + '/../../data/insee_population_dom.csv'}),
    communes.aggregate(),
    communes.checkCommunes(),
    communes.serialize(),
    // Départements
    departements.init,
    departements.loadDepartements(),
    departements.serialize(),
    // Régions
    regions.init,
    regions.loadRegions(),
    regions.serialize(),
    // Pays
    countries.init,
    countries.loadCountries(),
    countries.loadTerritories(),
    countries.serialize()
  ], done)
}

/* Exports */
module.exports = {integrate}
