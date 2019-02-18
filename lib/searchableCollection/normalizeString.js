const lunr = require('lunr')
const {deburr} = require('lodash')

function normalizeString(nom) {
  return deburr(nom)
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

lunr.Pipeline.registerFunction(normalizeString, 'normalizeString')

module.exports = normalizeString
