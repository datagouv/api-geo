/* eslint-env mocha */
const {init, serialize, loadCountries, loadTerritories} = require('../lib/integration/countries')
const expect = require('expect.js')

describe('#integration countries', () => {
  describe('init()', () => {
    let ctx
    beforeEach(done => {
      ctx = {}
      init(ctx, done)
    })

    describe('Context setup', () => {
      it('should set ctx.countries as an empty Map', () => {
        expect(ctx.countries).to.be.a(Map)
        expect(ctx.countries.size).to.be(0)
      })
    })

    describe('getCountry()', () => {
      describe('New country', () => {
        beforeEach(() => {
          expect(ctx.countries.size).to.be(0)
        })
        it('should return a country with given code', () => {
          const country = ctx.getCountry('42')
          expect(country).to.be.an(Object)
          expect(country).to.have.keys('code')
          expect(country).to.have.keys('territories')
          expect(country.code).to.be('42')
        })
        it('should store the country', () => {
          ctx.getCountry('21')
          expect(ctx.countries.size).to.be(1)
          expect(ctx.countries.has('21')).to.be.ok()
          const country = ctx.countries.get('21')
          expect(country).to.have.keys('code')
          expect(country).to.have.keys('territories')
          expect(country.code).to.be('21')
        })
      })

      describe('Existing country', () => {
        beforeEach(() => {
          ctx.getCountry('11')
          expect(ctx.countries.size).to.be(1)
        })
        it('should return a country with given code', () => {
          const country = ctx.getCountry('11')
          expect(country).to.be.an(Object)
          expect(country).to.have.keys('code')
          expect(country).to.have.keys('territories')
          expect(country.code).to.be('11')
        })
        it('should have no impact on storage', () => {
          ctx.getCountry('11')
          expect(ctx.countries.has('11')).to.be.ok()
          expect(ctx.countries.size).to.be(1)
        })
      })
    })
  })

  describe('loadCountries()', () => {
    let ctx
    let country
    beforeEach(() => {
      country = {}
      ctx = {
        debug: () => {},
        getCountry: code => {
          country.code = code
          return country
        },
        loadTerritories: (country, srcPath, callBack) => {
          country.territories = []
          callBack()
        }
      }
    })

    describe('Processing a file containing 1 country', () => {
      it('should store 1 country', done => {
        loadCountries({srcPath: __dirname + '/integration-data/countries.tsv'})(ctx, err => {
          expect(err).to.be(undefined)
          expect(country).to.eql({
            code: '123456',
            nom: 'TEST',
            iso2: 'TS',
            iso3: 'TST',
            num: '250'
          })
          done()
        })
      })
    })
  })

  describe('loadTerritories()', () => {
    describe('Processing a file containing a relation with known COG code', () => {
      it('should associate territories to the country', done => {
        const country = {code: '123456', territories: new Set()}
        const ctx = {
          countries: {has: () => true},
          debug: () => {},
          getCountry: () => country
        }

        loadTerritories({srcPath: __dirname + '/integration-data/countries-territories.tsv'})(ctx, err => {
          expect(err).to.be(undefined)
          expect([...country.territories]).to.eql(
            [
              {
                iso2: 'T1',
                iso3: 'T1',
                nom: 'TEST1',
                num: '251'
              },
              {
                iso2: 'T2',
                iso3: 'T2',
                nom: 'TEST2',
                num: '252'
              }
            ])
          done()
        })
      })
    })

    describe('Country has no territories', () => {
      it('should not associate any territory', done => {
        const country = {code: '654321', territories: new Set()}
        const ctx = {
          countries: {has: () => true},
          debug: () => {},
          getCountry: code => code === country.code ? country : {territories: new Set()}
        }

        loadTerritories({srcPath: __dirname + '/integration-data/countries-territories.tsv'})(ctx, err => {
          expect(err).to.be(undefined)
          expect([...country.territories]).to.eql([])
          done()
        })
      })
    })
  })

  describe('serialize()', () => {
    describe('No country', () => {
      it('should throw an error', done => {
        const ctx = {debug: () => {}, countries: new Map()}
        serialize()(ctx, err => {
          expect(err).to.be.an(Error)
          expect(err.message).to.be('No country')
          done()
        })
      })
    })

    describe('One country', () => {
      const path = '../data/test-serialize-country.json'
      it('should generate a JSON file with one country inside', done => {
        const ctx = {debug: () => {}, countries: new Map([
          ['42', {
            code: '42',
            nom: 'Test',
            territories: new Set()
          }]
        ])}
        serialize({destPath: __dirname + '/' + path})(ctx, err => {
          expect(err).to.be(undefined)
          const countries = require(path)
          expect(countries).to.have.length(1)
          expect(countries[0]).to.eql({
            code: '42',
            nom: 'Test',
            territories: []
          })
          done()
        })
      })
    })
  })
})
