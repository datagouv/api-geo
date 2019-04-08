const {join} = require('path')
const {keyBy} = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const area = require('@turf/area').default
const centroid = require('@turf/centroid').default
const {readGeoJSONFeatures, writeData, fixPrecision} = require('./util')

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
        communeData.surface = fixPrecision(area(contour) / 10000, 2)
        communeData.centre = centroid(contour).geometry
      }

      if (MORTES_POUR_LA_FRANCE.includes(commune.code)) {
        communeData.mortePourLaFrance = true
      }

      return communeData
    })

  await writeData('communes', communesData)
}

module.exports = {buildCommunes}
