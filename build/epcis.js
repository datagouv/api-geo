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

function getDepartementsFromMembresEPCI(membres) {
  const departementsDuplicated = membres.map(membre => {
    // Si on commence par 97 le code département à déduire du code commune est de longueur 3
    // sinon c'est 2
    if (membre.code.startsWith('97')) {
      return membre.code.substring(0, 3)
    }

    return membre.code.substring(0, 2)
  })
  // On enlève les doublons avec Set puis on trie pour avoir les codes départements dans l'ordre
  return [...new Set(departementsDuplicated)].sort()
}

function getRegionsFromDepartements(codesDepartements, departementsIndex) {
  const regionsDuplicated = codesDepartements.map(dep => departementsIndex[dep].region)
  // On enlève les doublons avec Set puis on trie pour avoir les codes régions dans l'ordre
  return [...new Set(regionsDuplicated)].sort()
}

function getInfosFromFeatures(codeEpci, epciFeaturesIndex) {
  if (codeEpci in epciFeaturesIndex) {
    const contour = epciFeaturesIndex[codeEpci].geometry
    const surface = fixPrecision(area(contour) / 10000, 2)
    const centre = truncate(pointOnFeature(contour), {precision: 4}).geometry
    const bboxEpci = bbox(epciFeaturesIndex[codeEpci])
    const bboxPolygonEpci = bboxPolygon(bboxEpci)
    return {
      contour,
      surface,
      centre,
      bbox: bboxPolygonEpci.geometry
    }
  }

  return {}
}

async function buildEpcis() {
  const epciFeatures = await readGeoJSONFeatures(EPCI_FEATURES_PATH)
  const epciFeaturesIndex = keyBy(epciFeatures, f => f.properties.code)
  const departementsIndex = keyBy(departements, f => f.code)

  const epcisData = epcis
    .map(epci => {
      const codesDepartements = getDepartementsFromMembresEPCI(epci.membres)
      const codesRegions = getRegionsFromDepartements(codesDepartements, departementsIndex)
      const {code, type, nom} = epci
      const epciData = {
        code,
        type,
        financement: epci.modeFinancement,
        nom,
        codesDepartements,
        codesRegions,
        population: epci.populationMunicipale,
        zone: codesDepartements.some(dep => dep.length === 3) ? 'drom' : 'metro',
        ...getInfosFromFeatures(epci.code, epciFeaturesIndex)
      }

      return epciData
    })

  await writeData('epci', epcisData)
}

module.exports = {buildEpcis}
