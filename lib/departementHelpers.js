const {initFields} = require('./helpers')

const initDepartementFields = initFields({
  default: ['nom', 'code', 'codeRegion'],
  base: ['nom', 'code']
})

module.exports = {initDepartementFields}
