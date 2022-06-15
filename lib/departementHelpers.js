const {initFields} = require('./helpers')

const initDepartementFields = initFields({
  default: ['nom', 'code', 'codeRegion'],
  base: ['nom', 'code']
})

const departementsDefaultQuery = {zone: ['metro', 'dom']}

module.exports = {initDepartementFields, departementsDefaultQuery}
