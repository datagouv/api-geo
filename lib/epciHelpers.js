const {initFields, initFormat} = require('./helpers')

const initEpciFields = initFields({
  default: ['nom', 'code', 'codesDepartements', 'codesRegions', 'population'],
  base: ['nom', 'code']
})

const initEpciFormat = initFormat({
  geometries: ['centre', 'contour', 'bbox'],
  defaultGeometry: 'centre'
})

const epciDefaultQuery = {zone: ['metro', 'drom']}

module.exports = {initEpciFields, initEpciFormat, epciDefaultQuery}
