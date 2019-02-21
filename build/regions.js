const regions = require('@etalab/decoupage-administratif/data/regions.json')
const {writeData} = require('./util')

async function buildRegions() {
  const regionsData = regions
    .map(region => {
      return {
        code: region.code,
        nom: region.nom
      }
    })

  await writeData('regions', regionsData)
}

module.exports = {buildRegions}
