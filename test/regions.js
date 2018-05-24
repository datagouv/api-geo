/* eslint-env mocha */
const expect = require('expect.js')
const regions = require('../lib/regions')
const {cloneDeep} = require('lodash')

describe('regions', () => {
  let db
  const region1 = {nom: 'one', code: '11'}
  const region2 = {nom: 'two', code: '22'}
  const region3 = {nom: 'three', code: '33'}

  beforeEach(done => {
    db = regions.getIndexedDb({regions: [region1, region2, region3].map(cloneDeep)})
    done()
  })

  describe('getIndexedDb()', () => {
    describe('bad regions db path', () => {
      it('should throw an error', () => {
        expect(() => regions.getIndexedDb({regionsDbPath: '_'})).to.throwError()
      })
    })
  })

  describe('indexes', () => {
    describe('indexes list', () => {
      const db = regions.getIndexedDb({regions: []});
      [
        'nom',
        'code'
      ].forEach(index => {
        it(`should contain '${index}' index`, () => {
          expect(db._indexes).to.have.key(index)
        })
      })
    })
  })

  describe('search()', () => {
    describe('No criteria', () => {
      it('should return everything', () => {
        expect(db.search()).to.eql([region1, region2, region3])
      })
    })
    describe('Simple matching criteria', () => {
      it('should return an array with 1 region', () => {
        expect(db.search({code: '11'})).to.eql([region1])
      })
    })
    describe('Disjoint criteria', () => {
      it('should return an empty array', () => {
        expect(db.search({nom: 'three', code: '22'})).to.eql([])
      })
    })
    describe('All criteria', () => {
      it('should return an array with 1 region', () => {
        expect(db.search({nom: 'three', code: '33'})).to.eql([
          {nom: 'three', code: '33', _score: 1}
        ])
        db.search({nom: 'three', code: '33'}).forEach(reg => {
          expect(reg).to.have.key('_score')
          expect(reg._score >= 0).to.be.ok()
        })
      })
    })
  })
})
