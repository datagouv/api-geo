const departements = require('@etalab/decoupage-administratif/data/departements.json')
const {writeData} = require('./util')

async function buildDepartements() {
  const departementsData = departements
    .map(departement => {
      return {
        code: departement.code,
        nom: departement.nom,
        chefLieu: departement.chefLieu,
        codeRegion: departement.region,
        zone: departement.zone
      }
    })

  await writeData('departements', departementsData)
}

module.exports = {buildDepartements}
