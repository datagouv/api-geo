const { pick } = require('lodash');

function initRegionFields(req, res, next) {
  if (req.query.fields) {
    req.fields = new Set(req.query.fields.split(','));
  } else {
    req.fields = new Set(['nom', 'code']);
  }
  req.fields.add('code');
  req.fields.add('nom');
  next();
}

function formatRegion(req, region) {
  return pick(region, Array.from(req.fields));
}

module.exports = { initRegionFields, formatRegion };
