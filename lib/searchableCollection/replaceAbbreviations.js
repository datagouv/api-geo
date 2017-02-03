function replaceAbbreviations(terms, patterns) {
  if (!terms.includes(' ') && !terms.includes('-')) return terms;

  return terms
    .toLocaleLowerCase()
    .replace(/^['"]|['"]$/g, '') // Remove single and double quotes around string
    .replace(/-/g, ' ')
    .split(' ')
    .map(token => token in patterns ? patterns[token] : token)
    .join(' ');
}

module.exports = replaceAbbreviations;
