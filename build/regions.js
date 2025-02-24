const regions = require('@etalab/decoupage-administratif/data/regions.json')
const {writeData} = require('./util')

async function buildRegions() {
  const regionsData = regions
    .map(region => {
      return {
        code: region.code,
        chefLieu: region.chefLieu,
        nom: region.nom,
        zone: region.zone
      }
    })

  await writeData('regions', regionsData)
}

module.exports = {buildRegions}
