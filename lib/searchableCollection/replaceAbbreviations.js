const removeDiacritics = require('./removeDiacritics');

function replaceAbbreviations(search, abbreviations) {
  const terms = removeDiacritics(search)
    .toLowerCase()
    .replace(/"/g, '')
    .replace(/-/g, ' ')
    .split(' ');

  if (terms.length <= 1) return search;

  return terms
    .map(token => token in abbreviations ? abbreviations[token] : token)
    .join(' ');
}

module.exports = replaceAbbreviations;
