const {join} = require('path')
const {keyBy} = require('lodash')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const epci = require('@etalab/decoupage-administratif/data/epci.json')
const area = require('@turf/area').default
const pointOnFeature = require('@turf/point-on-feature').default
const truncate = require('@turf/truncate').default
const bbox = require('@turf/bbox').default
const bboxPolygon = require('@turf/bbox-polygon').default
const {readGeoJSONFeatures, writeData, fixPrecision} = require('./util')

const resolution = process.env.BUILD_LOW_RESOLUTION === '1' ? '50m' : '5m'

const COMMUNES_FEATURES_PATH = join(__dirname, '..', 'data', `communes-${resolution}.geojson.gz`)
const COMMUNES_FEATURES_MAIRIE_PATH = join(__dirname, '..', 'data', 'mairies.geojson.gz')

const MORTES_POUR_LA_FRANCE = ['55189', '55039', '55050', '55239', '55307', '55139']

const COMMUNES_EPCI_MATCHING = epci.reduce((acc, curr) => {
  curr.membres.forEach(membre => {
    acc[membre.code] = curr.code
  })

  return acc
}, {})

const COMMUNES_DELEGUEES_INDEX = communes
  .filter(commune => {
    return ['commune-deleguee'].includes(commune.type)
  }).reduce((acc, curr) => {
    if (!(curr.chefLieu in acc)) {
      acc[curr.chefLieu] = []
    }

    acc[curr.chefLieu].push({code: curr.code, nom: curr.nom})
    return acc
  }, {})

const COMMUNES_ASSOCIEES_INDEX = communes
  .filter(commune => {
    return ['commune-associee'].includes(commune.type)
  }).reduce((acc, curr) => {
    if (!(curr.chefLieu in acc)) {
      acc[curr.chefLieu] = []
    }

    acc[curr.chefLieu].push({code: curr.code, nom: curr.nom})
    return acc
  }, {})

async function buildCommunes() {
  const communesFeatures = await readGeoJSONFeatures(COMMUNES_FEATURES_PATH)
  const communesFeaturesIndex = keyBy(communesFeatures, f => f.properties.code)
  const communesFeaturesMairie = await readGeoJSONFeatures(COMMUNES_FEATURES_MAIRIE_PATH)
  const communesFeaturesMairieIndex = keyBy(communesFeaturesMairie, f => f.properties.commune)

  const communesData = communes
    .filter(commune => {
      return ['commune-actuelle', 'arrondissement-municipal'].includes(commune.type)
    })
    .map(commune => {
      const communeData = {
        code: commune.code,
        type: commune.type,
        nom: commune.nom,
        siren: commune.siren,
        codeDepartement: commune.departement,
        codeRegion: commune.region,
        codesPostaux: [...(commune.codesPostaux || [])].sort(),
        population: commune.population,
        zone: commune.zone
      }

      if (commune.code in COMMUNES_EPCI_MATCHING) {
        communeData.codeEpci = COMMUNES_EPCI_MATCHING[commune.code]
      }

      if (commune.code in COMMUNES_ASSOCIEES_INDEX) {
        communeData.associees = COMMUNES_ASSOCIEES_INDEX[commune.code]
      } else {
        communeData.associees = null
      }

      if (commune.code in COMMUNES_DELEGUEES_INDEX) {
        communeData.deleguees = COMMUNES_DELEGUEES_INDEX[commune.code]
      } else {
        communeData.deleguees = null
      }

      if (commune.code in communesFeaturesIndex) {
        const contour = communesFeaturesIndex[commune.code].geometry
        communeData.contour = contour
        communeData.surface = fixPrecision(area(contour) / 10000, 2)
        communeData.centre = truncate(pointOnFeature(contour), {precision: 4}).geometry
        const bboxCommune = bbox(communesFeaturesIndex[commune.code])
        const bboxPolygonCommune = bboxPolygon(bboxCommune)
        communeData.bbox = bboxPolygonCommune.geometry
        if (commune.code in communesFeaturesMairieIndex) {
          communeData.mairie = truncate(communesFeaturesMairieIndex[commune.code], {precision: 4}).geometry
        } else {
          console.log('Pas de mairie associée à', commune.code)
          communeData.mairie = communeData.centre
        }
      }

      if (MORTES_POUR_LA_FRANCE.includes(commune.code)) {
        communeData.mortePourLaFrance = true
      }

      return communeData
    })

  await writeData('communes', communesData)
}

module.exports = {buildCommunes}
