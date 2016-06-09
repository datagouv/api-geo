const removeDiacritics = require('./removeDiacritics');
const lunr = require('lunr');

function normalizeString(nom) {
  return removeDiacritics(nom)
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

lunr.Pipeline.registerFunction(normalizeString, 'normalizeString');

module.exports = normalizeString;
