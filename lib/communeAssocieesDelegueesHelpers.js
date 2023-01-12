const {initFields, initFormat} = require('./helpers')

const initCommunesAssocieeDelegueeFields = initFields({
  default: ['nom', 'code', 'chefLieu', 'codeDepartement', 'codeEpci', 'codeRegion', 'codesPostaux'],
  base: ['nom', 'code']
})

const initCommuneAssocieeDelegueeFormat = initFormat({
  geometries: ['centre', 'contour', 'bbox'],
  defaultGeometry: 'centre'
})

const communesAssocieesDelegueesDefaultQuery = {type: ['commune-associee', 'commune-deleguee']}

module.exports = {initCommunesAssocieeDelegueeFields, initCommuneAssocieeDelegueeFormat, communesAssocieesDelegueesDefaultQuery}
