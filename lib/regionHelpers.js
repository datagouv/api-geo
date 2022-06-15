const {initFields} = require('./helpers')

const initRegionFields = initFields({
  default: ['nom', 'code'],
  base: ['nom', 'code']
})

const regionsDefaultQuery = {zone: ['metro', 'dom']}

module.exports = {initRegionFields, regionsDefaultQuery}
