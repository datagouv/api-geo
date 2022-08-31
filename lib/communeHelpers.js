const {initFields, initFormat} = require('./helpers')

const initCommuneFields = initFields({
  default: ['nom', 'code', 'codeDepartement', 'siren', 'codeEpci', 'codeRegion', 'codesPostaux', 'population'],
  base: ['nom', 'code']
})

const initCommuneFormat = initFormat({
  geometries: ['centre', 'contour', 'mairie', 'bbox'],
  defaultGeometry: 'centre'
})

const communesDefaultQuery = {type: ['commune-actuelle'], zone: ['metro', 'drom', 'com']}

module.exports = {initCommuneFields, initCommuneFormat, communesDefaultQuery}
