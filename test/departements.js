/* eslint-env mocha */
const {cloneDeep} = require('lodash')
const expect = require('expect.js')
const departements = require('../lib/departements')

describe('departements', () => {
  let db
  const departement1 = {nom: 'one', code: '11', codeRegion: '00'}
  const departement2 = {nom: 'two', code: '22', codeRegion: '11'}
  const departement3 = {nom: 'three', code: '33', codeRegion: '11'}

  beforeEach(done => {
    db = departements.getIndexedDb({departements: [departement1, departement2, departement3].map(cloneDeep)})
    done()
  })

  describe('getIndexedDb()', () => {
    describe('bad departements db path', () => {
      it('should throw an error', () => {
        expect(() => departements.getIndexedDb({departementsDbPath: '_'})).to.throwError()
      })
    })
  })

  describe('indexes', () => {
    describe('indexes list', () => {
      const db = departements.getIndexedDb({departements: []});
      [
        'nom',
        'code',
        'codeRegion'
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
        expect(db.search()).to.eql([departement1, departement2, departement3])
      })
    })
    describe('Simple matching criteria', () => {
      it('should return an array with 1 departement', () => {
        expect(db.search({code: '11'})).to.eql([departement1])
      })
    })
    describe('Disjoint criteria', () => {
      it('should return an empty array', () => {
        expect(db.search({code: '22', codeRegion: '00'})).to.eql([])
      })
    })
    describe('Intersecting criteria (1 departement)', () => {
      it('should return an array with 1 departement', () => {
        expect(db.search({code: '33', codeRegion: '11'})).to.eql([departement3])
      })
    })
    describe('All criteria', () => {
      it('should return an array with 1 departement', () => {
        expect(db.search({nom: 'three', code: '33', codeRegion: '11'})).to.eql([
          {nom: 'three', code: '33', codeRegion: '11', _score: 1}
        ])
        db.search({nom: 'three', code: '33', codeRegion: '11'}).forEach(dep => {
          expect(dep).to.have.key('_score')
          expect(dep._score >= 0).to.be.ok()
        })
      })
    })
  })
})
