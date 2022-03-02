// Adapted from https://github.com/mapbox/which-polygon
const rbush = require('rbush')

// Ray casting algorithm for detecting if point is in polygon
function insidePolygon(rings, p) {
  let inside = false
  for (let i = 0, len = rings.length; i < len; i++) {
    const ring = rings[i]
    for (let j = 0, len2 = ring.length, k = len2 - 1; j < len2; k = j++) {
      if (rayIntersect(p, ring[j], ring[k])) {
        inside = !inside
      }
    }
  }

  return inside
}

function rayIntersect(p, p1, p2) {
  return ((p1[1] > p[1]) !== (p2[1] > p[1])) && (p[0] < ((p2[0] - p1[0]) * (p[1] - p1[1]) / (p2[1] - p1[1])) + p1[0])
}

function treeItem(coords, props) {
  const item = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    coords,
    props
  }

  for (let i = 0; i < coords[0].length; i++) {
    const p = coords[0][i]
    item.minX = Math.min(item.minX, p[0])
    item.minY = Math.min(item.minY, p[1])
    item.maxX = Math.max(item.maxX, p[0])
    item.maxY = Math.max(item.maxY, p[1])
  }

  return item
}

class GeoIndex {
  constructor(key) {
    if (!key) {
      throw new Error('key is required')
    }

    this._key = key
    this._tree = rbush()
  }

  indexForPolygonRings(polygonRings, item) {
    this._tree.insert(treeItem(polygonRings, item))
  }

  index(item) {
    if (this._key in item) {
      const geometry = item[this._key]
      if (geometry.type === 'Polygon') {
        this.indexForPolygonRings(geometry.coordinates, item)
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygonRings => this.indexForPolygonRings(polygonRings, item))
      }
    }
  }

  load(items = []) {
    items.forEach(item => this.index(item))
  }

  find(point, query) {
    const result = this._tree.search({
      minX: point[0],
      minY: point[1],
      maxX: point[0],
      maxY: point[1]
    })
    for (let i = 0; i < result.length; i++) {
      if (query.type[0] === result[i].props.type) {
        if (insidePolygon(result[i].coords, point)) {
          return [result[i].props]
        }
      }
    }

    return []
  }
}

module.exports = GeoIndex
