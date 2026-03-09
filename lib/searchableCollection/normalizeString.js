const lunr = require('lunr')
const {deburr} = require('lodash')

function normalizeString(nom) {
  return deburr(nom
    .toLocaleLowerCase('fr-FR')
    .replace(/ [dl]'/g, '')
    .replace(/^[dl]'/g, '')
    .replace(/-/g, ' ')
  )
    .replace(/[^a-z]/g, '')
}

lunr.Pipeline.registerFunction(normalizeString, 'normalizeString')

module.exports = normalizeString
