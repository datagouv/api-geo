const lunr = require('lunr')
const removeDiacritics = require('./removeDiacritics')

function normalizeString(nom) {
  return removeDiacritics(nom)
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

lunr.Pipeline.registerFunction(normalizeString, 'normalizeString')

module.exports = normalizeString
