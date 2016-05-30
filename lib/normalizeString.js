const removeDiacritics = require('./removeDiacritics');

module.exports = function normalizeString(nom) {
  return removeDiacritics(nom)
    .toLowerCase()
    .replace(/[^a-z]/g, '');
};
