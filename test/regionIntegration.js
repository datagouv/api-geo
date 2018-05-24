/* eslint-env mocha */
const {init, serialize, loadRegions} = require('../lib/integration/regions')
const expect = require('expect.js')

describe('#integration regions', () => {
  describe('init()', () => {
    let ctx
    beforeEach(done => {
      ctx = {}
      init(ctx, done)
    })

    describe('Context setup', () => {
      it('should set ctx.regions as an empty Map', () => {
        expect(ctx.regions).to.be.a(Map)
        expect(ctx.regions.size).to.be(0)
      })
      it('should set ctx.getRegion function',
        () => expect(ctx.getRegion).to.be.a(Function))
    })

    describe('getRegion()', () => {
      describe('New region', () => {
        beforeEach(() => {
          expect(ctx.regions.size).to.be(0)
        })
        it('should return a region with given code', () => {
          const region = ctx.getRegion('42')
          expect(region).to.be.an(Object)
          expect(region).to.only.have.keys('code')
          expect(region.code).to.be('42')
        })
        it('should store the region', () => {
          ctx.getRegion('21')
          expect(ctx.regions.size).to.be(1)
          expect(ctx.regions.has('21')).to.be.ok()
          const region = ctx.regions.get('21')
          expect(region).to.only.have.keys('code')
          expect(region.code).to.be('21')
        })
      })

      describe('Existing region', () => {
        beforeEach(() => {
          ctx.getRegion('11')
          expect(ctx.regions.size).to.be(1)
        })
        it('should return a region with given code', () => {
          const region = ctx.getRegion('11')
          expect(region).to.be.an(Object)
          expect(region).to.only.have.keys('code')
          expect(region.code).to.be('11')
        })
        it('should have no impact on storage', () => {
          ctx.getRegion('11')
          expect(ctx.regions.has('11')).to.be.ok()
          expect(ctx.regions.size).to.be(1)
        })
      })
    })
  })

  describe('loadRegions()', () => {
    let ctx
    let region
    beforeEach(() => {
      region = { }
      ctx = {
        debug: () => {},
        getRegion: code => {
          region.code = code
          return region
        }
      }
    })

    describe('Processing a file containing 1 region', () => {
      it('should store 1 region', done => {
        loadRegions({srcPath: __dirname + '/integration-data/regions.tsv'})(ctx, err => {
          expect(err).to.be(undefined)
          expect(region).to.eql({code: '42', nom: 'Test'})
          done()
        })
      })
    })
  })

  describe('serialize()', () => {
    describe('No region', () => {
      it('should throw an error', done => {
        const ctx = {debug: () => {}, regions: new Map()}
        serialize()(ctx, err => {
          expect(err).to.be.an(Error)
          expect(err.message).to.be('No regions')
          done()
        })
      })
    })

    describe('One region', () => {
      const path = '../data/test-serialize-region.json'
      it('should generate a JSON file with one region inside', done => {
        const ctx = {debug: () => {}, regions: new Map([
          ['42', {
            code: '42',
            nom: 'Test'
          }]
        ])}
        serialize({destPath: __dirname + '/' + path})(ctx, err => {
          expect(err).to.be(undefined)
          const regions = require(path)
          expect(regions).to.have.length(1)
          expect(regions[0]).to.eql({
            code: '42',
            nom: 'Test'
          })
          done()
        })
      })
    })
  })
})
