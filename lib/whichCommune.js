// Adapted from https://github.com/mapbox/which-polygon
const rbush = require('rbush');

function whichCommune() {
  const tree = rbush();

  return {
    query: function query(p) {
      const result = tree.search([p[0], p[1], p[0], p[1]]);
      for (let i = 0; i < result.length; i++) {
        if (insidePolygon(result[i][4], p)) return result[i][5];
      }
      return null;
    },
    insert: function insert(commune) {
      const contour = commune.contour;
      if (contour.type === 'Polygon') {
        tree.insert(treeItem(contour.coordinates, commune));
      } else if (contour.type === 'MultiPolygon') {
        for (let j = 0; j < contour.coordinates.length; j++) {
          tree.insert(treeItem(contour.coordinates[j], commune));
        }
      }
    },
  };
}

// ray casting algorithm for detecting if point is in polygon
function insidePolygon(rings, p) {
  let inside = false;
  for (let i = 0, len = rings.length; i < len; i++) {
    const ring = rings[i];
    for (let j = 0, len2 = ring.length, k = len2 - 1; j < len2; k = j++) {
      if (rayIntersect(p, ring[j], ring[k])) inside = !inside;
    }
  }
  return inside;
}

function rayIntersect(p, p1, p2) {
  return ((p1[1] > p[1]) !== (p2[1] > p[1])) && (p[0] < (p2[0] - p1[0]) * (p[1] - p1[1]) / (p2[1] - p1[1]) + p1[0]);
}

function treeItem(coords, props) {
  const item = [Infinity, Infinity, -Infinity, -Infinity, coords, props];

  for (let i = 0; i < coords[0].length; i++) {
    const p = coords[0][i];
    item[0] = Math.min(item[0], p[0]);
    item[1] = Math.min(item[1], p[1]);
    item[2] = Math.max(item[2], p[0]);
    item[3] = Math.max(item[3], p[1]);
  }
  return item;
}

module.exports = whichCommune;
