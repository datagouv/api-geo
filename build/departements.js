const departements = require('@etalab/decoupage-administratif/data/departements.json')
const {writeData} = require('./util')

async function buildDepartements() {
  const departementsData = departements
    .map(departement => {
      return {
        code: departement.code,
        nom: departement.nom,
        codeRegion: departement.region
      }
    })

  await writeData('departements', departementsData)
}

module.exports = {buildDepartements}
