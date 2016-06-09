const { pick } = require('lodash');

function initDepartementFields(req, res, next) {
  if (req.query.fields) {
    req.fields = new Set(req.query.fields.split(','));
  } else {
    req.fields = new Set(['nom', 'code', 'codeRegion']);
  }
  req.fields.add('code');
  req.fields.add('nom');
  next();
}

function formatDepartement(req, departement) {
  return pick(departement, Array.from(req.fields));
}

module.exports = { initDepartementFields, formatDepartement };
