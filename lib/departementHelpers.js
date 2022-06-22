const {initFields} = require('./helpers')

const initDepartementFields = initFields({
  default: ['nom', 'code', 'codeRegion'],
  base: ['nom', 'code']
})

const departementsDefaultQuery = {zone: ['metro', 'drom']}

module.exports = {initDepartementFields, departementsDefaultQuery}
