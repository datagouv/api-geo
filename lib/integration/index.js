const departements = require('./departements');
const communes = require('./communes');
const regions = require('./regions');
const pipeline = require('./pipeline');

const DATA_DIR = __dirname + '/../../data';

/* Pipeline */
function integrate(done) {
  pipeline([
    // Communes
    communes.init,
    communes.loadCommunes(),
    communes.loadGeometries({ srcPath: DATA_DIR + '/communes-dp25.json' }),
    communes.loadGeometries({ srcPath: DATA_DIR + '/osm_arrondissements_municipaux_2016.json' }),
    communes.loadCodePostaux(),
    communes.codesPostauxFictifs(),
    communes.loadPopulation({ srcPath: DATA_DIR + '/insee_population_metropole.csv' }),
    communes.loadPopulation({ srcPath: DATA_DIR + '/insee_population_dom.csv' }),
    communes.loadPopulation({ srcPath: DATA_DIR + '/insee_population_arrondissements.csv' }),
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
  ], done);
}

/* Exports */
module.exports = { integrate };
