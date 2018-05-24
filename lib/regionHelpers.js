const {initFields} = require('./helpers')

const initRegionFields = initFields({
  default: ['nom', 'code'],
  base: ['nom', 'code']
})

module.exports = {initRegionFields}
