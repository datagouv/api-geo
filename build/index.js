#!/usr/bin/env node --max_old_space_size=4096
const {buildCommunes} = require('./communes')
const {buildCommunesAssocieesDeleguees} = require('./communes-associees-deleguees')
const {buildEpcis} = require('./epcis')
const {buildDepartements} = require('./departements')
const {buildRegions} = require('./regions')

async function main() {
  await buildCommunes()
  await buildCommunesAssocieesDeleguees()
  await buildEpcis()
  await buildDepartements()
  await buildRegions()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
