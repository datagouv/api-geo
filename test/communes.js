/* eslint-env mocha */
const expect = require('expect.js')
const communes = require('../lib/communes')
const {cloneDeep} = require('lodash')

describe('communes', () => {
  describe('getIndexedDb()', () => {
    describe('bad communes db path', () => {
      it('should throw an error', () => {
        expect(() => communes.getIndexedDb({communesDbPath: '_'})).to.throwError()
      })
    })
  })

  describe('indexes', () => {
    describe('indexes list', () => {
      const db = communes.getIndexedDb({communes: []});
      [
        'nom',
        'code',
        'codesPostaux',
        'codeDepartement',
        'codeRegion',
        'contour'
      ].forEach(index => {
        it(`should contain '${index}' index`, () => {
          expect(db._indexes).to.have.key(index)
        })
      })
    })
  })

  describe('search()', () => {
    const geom1 = {type: 'Polygon', coordinates: [[[-10, -10], [-10, 0], [0, 0], [0, -10], [-10, -10]]]}
    const geom2 = {type: 'Polygon', coordinates: [[[-10, 0], [-10, 10], [0, 10], [0, 0], [-10, 0]]]}
    const geom3 = {type: 'Polygon', coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]}
    const commune1 = {nom: 'abc', code: '12345', codeDepartement: '02', codeRegion: 'A', codesPostaux: ['11111', '22222'], contour: geom1}
    const commune2 = {nom: 'efg', code: '23456', codeDepartement: '02', codeRegion: 'A', codesPostaux: ['11111'], contour: geom2}
    const commune3 = {nom: 'efg', code: '67890', codeDepartement: '01', codeRegion: 'B', codesPostaux: ['11111'], contour: geom3}
    const db = communes.getIndexedDb({communes: [commune1, commune2, commune3].map(cloneDeep)})

    describe('Simple matching criteria', () => {
      it('should return an array with 1 commune', () => {
        expect(db.search({code: '12345'})).to.eql([commune1])
      })
    })

    describe('Disjoint criteria', () => {
      it('should return an empty array', () => {
        expect(db.search({code: '23456', codePostal: '22222'}).map(c => c.code)).to.eql([])
      })
    })
    describe('Intersecting criteria (1 commune)', () => {
      it('should return an array with 1 commune', () => {
        expect(db.search({code: '23456', codePostal: '11111'})).to.eql([commune2])
      })
    })
    describe('Intersecting criteria (2 communes)', () => {
      it('should return an array with 2 communes', () => {
        expect(db.search({nom: 'efg', codePostal: '11111'}).map(c => c.code)).to.eql([
          '23456',
          '67890'
        ])
        db.search({nom: 'efg', codePostal: '11111'}).forEach(commune => {
          expect(commune).to.have.key('_score')
          expect(commune._score >= 0).to.be.ok()
        })
      })
    })
    describe('All criteria', () => {
      it('should return an array with no commune', () => {
        const query = {nom: 'efg', code: '67890', codeDepartement: '01', codeRegion: 'B', codePostal: '11111', pointInContour: [5, 5], type: ['commune-actuelle']}
        expect(db.search(query).map(c => c.code)).to.eql([])
      })
    })
  })

  describe('Boost for population (integration)', () => {
    const db = communes.getIndexedDb()
    describe('Searching for `nant` without boost', () => {
      it('should not return Nantes in first position', () => {
        const result = db.search({nom: 'nant'})
        expect(result[0].nom).not.to.be('Nantes')
      })
    })
    describe('Searching for `nant` with population boost', () => {
      it('should return Nantes in first position', () => {
        const result = db.search({nom: 'nant', boost: 'population'})
        expect(result[0].nom).to.be('Nantes')
      })
    })
  })
})
