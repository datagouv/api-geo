#!/usr/bin/env node --max_old_space_size=4096
const {buildCommunes} = require('./communes')
const {buildDepartements} = require('./departements')
const {buildRegions} = require('./regions')

async function main() {
  await buildCommunes()
  await buildDepartements()
  await buildRegions()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
