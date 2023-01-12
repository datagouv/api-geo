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

const COMMUNES_ASSOCIEES_DELEGUEES_FEATURES_PATH = join(__dirname, '..', 'data', `communes-associees-ou-deleguees-${resolution}.geojson.gz`)
// Ogr2ogr -f GeoJSON communes-associees-ou-deleguees-5m.geojson COMMUNE_ASSOCIEE_OU_DELEGUEE.shp -dialect SQLite -sql "SELECT \"INSEE_COM\" AS code, \"NOM\" AS nom, substr(\"INSEE_COM\", 1, 2) AS departement, cast('' AS text) AS region, cast('' AS text) AS epci, \"NATURE\" AS nature, geometry FROM \"COMMUNE_ASSOCIEE_OU_DELEGUEE\"" -lco RFC7946=YES -lco WRITE_NAME=NO
// gzip --keep communes-associees-ou-deleguees-5m.geojson

const COMMUNES_EPCI_MATCHING = epci.reduce((acc, curr) => {
  curr.membres.forEach(membre => {
    acc[membre.code] = curr.code
  })

  return acc
}, {})

async function buildCommunesAssocieesDeleguees() {
  const communesAssocieesDelegueesFeatures = await readGeoJSONFeatures(COMMUNES_ASSOCIEES_DELEGUEES_FEATURES_PATH)
  const communesAssocieesDelegueesFeaturesIndex = keyBy(communesAssocieesDelegueesFeatures, f => f.properties.code)

  const communesAssocieesDelegueesData = communes
    .filter(commune => {
      return ['commune-associee', 'commune-deleguee'].includes(commune.type)
    })
    .map(commune => {
      const communeData = {
        code: commune.code,
        type: commune.type,
        nom: commune.nom,
        chefLieu: commune.chefLieu,
        codeDepartement: commune.departement,
        codeRegion: commune.region
      }

      if (commune.code in communesAssocieesDelegueesFeaturesIndex) {
        const contour = communesAssocieesDelegueesFeaturesIndex[commune.code].geometry
        communeData.contour = contour
        communeData.surface = fixPrecision(area(contour) / 10000, 2)
        communeData.centre = truncate(pointOnFeature(contour), {precision: 4}).geometry
        const bboxCommune = bbox(communesAssocieesDelegueesFeaturesIndex[commune.code])
        const bboxPolygonCommune = bboxPolygon(bboxCommune)
        communeData.bbox = bboxPolygonCommune.geometry
      }

      if (commune.chefLieu in COMMUNES_EPCI_MATCHING) {
        communeData.codeEpci = COMMUNES_EPCI_MATCHING[commune.chefLieu]
      }

      return communeData
    })

  await writeData('communes-associees-deleguees', communesAssocieesDelegueesData)
}

module.exports = {buildCommunesAssocieesDeleguees}
