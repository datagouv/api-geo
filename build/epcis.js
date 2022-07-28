const {join} = require('path')
const {keyBy} = require('lodash')
const epcis = require('@etalab/decoupage-administratif/data/epci.json')
const departements = require('@etalab/decoupage-administratif/data/departements.json')
const area = require('@turf/area').default
const bbox = require('@turf/bbox').default
const bboxPolygon = require('@turf/bbox-polygon').default
const pointOnFeature = require('@turf/point-on-feature').default
const truncate = require('@turf/truncate').default
const {readGeoJSONFeatures, writeData, fixPrecision} = require('./util')

const resolution = process.env.BUILD_LOW_RESOLUTION === '1' ? '50m' : '5m'

const EPCI_FEATURES_PATH = join(__dirname, '..', 'data', `epci-${resolution}.geojson.gz`)

async function buildEpcis() {
  const epciFeatures = await readGeoJSONFeatures(EPCI_FEATURES_PATH)
  const epciFeaturesIndex = keyBy(epciFeatures, f => f.properties.code)
  const departementsIndex = keyBy(departements, f => f.code)

  const epcisData = epcis
    .map(epci => {
      const codesDepartements = [...new Set(epci.membres.map(membre => membre.code.startsWith('97') ? membre.code.slice(0, 3) : membre.code.slice(0, 2)))].sort()
      const codesRegions = [...new Set(codesDepartements.map(dep => departementsIndex[dep].region))].sort()
      const epciData = {
        code: epci.code,
        type: epci.type,
        financement: epci.modeFinancement,
        nom: epci.nom,
        codesDepartements,
        codesRegions,
        population: epci.populationMunicipale,
        zone: codesDepartements[0].length === 2 ? 'metro' : 'drom'
      }

      if (epci.code in epciFeaturesIndex) {
        const contour = epciFeaturesIndex[epci.code].geometry
        epciData.contour = contour
        epciData.surface = fixPrecision(area(contour) / 10000, 2)
        epciData.centre = truncate(pointOnFeature(contour), {precision: 4}).geometry
        const bboxEpci = bbox(epciFeaturesIndex[epci.code])
        const bboxPolygonEpci = bboxPolygon(bboxEpci)
        epciData.bbox = bboxPolygonEpci.geometry
      }

      return epciData
    })

  await writeData('epci', epcisData)
}

module.exports = {buildEpcis}
