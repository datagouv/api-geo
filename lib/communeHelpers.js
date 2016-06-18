const { initFields, initFormat } = require('./helpers');

const initCommuneFields = initFields({
  default: ['nom', 'code', 'codeDepartement', 'codeRegion', 'codesPostaux', 'centre', 'surface', 'population'],
  base: ['nom', 'code'],
});

const initCommuneFormat = initFormat({
  geometries: ['centre', 'contour'],
  defaultGeometry: 'centre',
});

module.exports = { initCommuneFields, initCommuneFormat };
