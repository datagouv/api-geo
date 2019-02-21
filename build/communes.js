const {join} = require('path')
const {keyBy} = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const area = require('@turf/area').default
const centroid = require('@turf/centroid').default
const {readGeoJSONFeatures, writeData} = require('./util')

const COMMUNES_FEATURES_PATH = join(__dirname, '..', 'data', 'communes-5m.geojson.gz')

const MORTES_POUR_LA_FRANCE = ['55189', '55039', '55050', '55239', '55307', '55139']

async function buildCommunes() {
  const communesFeatures = await readGeoJSONFeatures(COMMUNES_FEATURES_PATH)
  const communesFeaturesIndex = keyBy(communesFeatures, f => f.properties.code)

  const communesData = communes
    .filter(commune => {
      return ['commune-actuelle', 'arrondissement-municipal'].includes(commune.type)
    })
    .map(commune => {
      const communeData = {
        code: commune.code,
        type: commune.type,
        nom: commune.nom,
        codeDepartement: commune.departement,
        codeRegion: commune.region,
        codesPostaux: commune.codesPostaux || [],
        population: commune.population
      }

      if (commune.code in communesFeaturesIndex) {
        const contour = communesFeaturesIndex[commune.code].geometry
        communeData.contour = contour
        communeData.surface = area(contour) / 10000
        communeData.centre = centroid(contour).geometry
      }

      if (MORTES_POUR_LA_FRANCE.includes(commune.code)) {
        communeData.mortePourLaFrance = true
      }

      // Ajout manuel en attendant une évolution de @etalab/decoupage-administratif
      communeData.push({
        code: '97801',
        type: 'commune-actuelle',
        nom: 'Saint-Martin',
        // Population légale 2013 (INSEE)
        population: 35594,
        // OSM
        centre: {type: 'Point', coordinates: [-63.08582, 18.06685]}
      })

      return communeData
    })

  await writeData('communes', communesData)
}

module.exports = {buildCommunes}
