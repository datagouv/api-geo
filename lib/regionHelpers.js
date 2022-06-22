const {initFields} = require('./helpers')

const initRegionFields = initFields({
  default: ['nom', 'code'],
  base: ['nom', 'code']
})

const regionsDefaultQuery = {zone: ['metro', 'drom']}

module.exports = {initRegionFields, regionsDefaultQuery}
