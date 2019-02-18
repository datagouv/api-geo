const {initFields, initFormat} = require('./helpers')

const initCommuneFields = initFields({
  default: ['nom', 'code', 'codeDepartement', 'codeRegion', 'codesPostaux', 'population'],
  base: ['nom', 'code']
})

const initCommuneFormat = initFormat({
  geometries: ['centre', 'contour'],
  defaultGeometry: 'centre'
})

const communesDefaultQuery = {type: ['commune-actuelle']}

module.exports = {initCommuneFields, initCommuneFormat, communesDefaultQuery}
