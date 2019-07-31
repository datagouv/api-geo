/* eslint-env mocha */
const expect = require('expect.js')
const {initFields, initFormat, formatOne} = require('../lib/helpers')

describe('helpers', () => {
  describe('initFields()', () => {
    describe('constructor', () => {
      describe('no params', () => {
        it('should throw an error', () => {
          expect(() => initFields()).to.throwError()
        })
      })
      describe('with base and default params', () => {
        it('should success', () => {
          expect(() => initFields({base: ['a', 'b'], default: ['a', 'b', 'c']})).not.to.throwError()
        })
      })
    })

    describe('instance', () => {
      function runTestCase(reqParams, expectedFields, done) {
        const req = {query: reqParams.query ? reqParams.query : {}}
        initFields({
          default: ['a', 'b', 'c', 'd'],
          base: ['a', 'b']
        })(req, undefined, err => {
          expect(err).to.be(undefined)
          expect(req.fields).to.be.a(Set)
          expect([...req.fields].sort()).to.eql(expectedFields.sort())
          done()
        })
      }

      it('empty request should return default fields', done => {
        runTestCase({}, ['a', 'b', 'c', 'd'], done)
      })

      it('fields should be read from query', done => {
        runTestCase(
          {query: {fields: 'a,b,x'}},
          ['a', 'b', 'x'],
          done
        )
      })

      it('base fields should always be present', done => {
        runTestCase(
          {query: {fields: 'x,y,z'}},
          ['a', 'b', 'x', 'y', 'z'],
          done
        )
      })
    })
  })

  describe('initFormat()', () => {
    describe('constructor', () => {
      describe('no params', () => {
        it('should success', () => {
          expect(() => initFormat()).not.to.throwError()
        })
      })
      describe('geometries only', () => {
        it('should throw an error', () => {
          expect(() => initFormat({geometries: ['a', 'b']})).to.throwError()
        })
      })
      describe('geometries and defaultGeometry not in geometries', () => {
        it('should throw an error', () => {
          expect(() => initFormat({geometries: ['a', 'b'], defaultGeometry: 'x'})).to.throwError()
        })
      })
      describe('geometries and defaultGeometry in geometries', () => {
        it('should success', () => {
          expect(() => initFormat({geometries: ['a', 'b'], defaultGeometry: 'a'})).not.to.throwError()
        })
      })
    })

    describe('instance', () => {
      describe('entities without geometries', () => {
        let instance
        beforeEach(() => instance = initFormat())

        it('should set json as default format', done => {
          const req = {query: {}, fields: new Set()}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.outputFormat).to.be('json')
            done()
          })
        })

        it('should accept json format', done => {
          const req = {query: {format: 'json'}, fields: new Set()}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.outputFormat).to.be('json')
            done()
          })
        })

        it('should not accept geojson format', done => {
          const req = {query: {format: 'geojson'}, fields: new Set()}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.outputFormat).to.be('json')
            done()
          })
        })
      })
      describe('entities with geometries', () => {
        let instance
        beforeEach(() => instance = initFormat({geometries: ['a', 'b'], defaultGeometry: 'a'}))

        it('should set json as default format', done => {
          const req = {query: {}, fields: new Set()}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.outputFormat).to.be('json')
            done()
          })
        });

        ['json', 'geojson'].forEach(format => {
          it('should accept ' + format + ' format', done => {
            const req = {query: {format}, fields: new Set()}
            instance(req, undefined, err => {
              expect(err).to.be(undefined)
              expect(req.outputFormat).to.be(format)
              done()
            })
          })
        })

        it('should remove geometries from fields (geojson)', done => {
          const req = {query: {format: 'geojson'}, fields: new Set(['x', 'a', 'b'])}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.outputFormat).to.be('geojson')
            expect(req.fields).to.be.a(Set)
            expect([...req.fields].sort()).to.eql(['x'].sort())
            done()
          })
        })

        it('should kept geometries in fields (json)', done => {
          const req = {query: {format: 'json'}, fields: new Set(['x', 'a', 'b'])}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.outputFormat).to.be('json')
            expect(req.fields).to.be.a(Set)
            expect([...req.fields].sort()).to.eql(['x', 'a', 'b'].sort())
            done()
          })
        })

        it('should set default geometry in req when not set in query (geojson)', done => {
          const req = {query: {format: 'geojson'}, fields: new Set(['x', 'a', 'b'])}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.geometry).to.be('a')
            done()
          })
        })

        it('should set geometry in req when set in query (geojson)', done => {
          const req = {query: {format: 'geojson', geometry: 'b'}, fields: new Set(['x', 'a', 'b'])}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.geometry).to.be('b')
            done()
          })
        })

        it('should set default geometry in req when geometry in query is unknown (geojson)', done => {
          const req = {query: {format: 'geojson', geometry: 'c'}, fields: new Set(['x', 'a', 'b'])}
          instance(req, undefined, err => {
            expect(err).to.be(undefined)
            expect(req.geometry).to.be('a')
            done()
          })
        })
      })
    })
  })

  describe('formatOne()', () => {
    it('should support json formatting', () => {
      expect(formatOne(
        {outputFormat: 'json', fields: new Set()},
        {a: 1, b: 2, c: 3, d: 4}
      )).to.eql({})
    })

    it('should support geojson formatting', () => {
      expect(formatOne(
        {
          query: {},
          outputFormat: 'geojson',
          geometry: 'x',
          fields: new Set()
        },
        {a: 1, b: 2, c: 3, x: 4, y: 6}
      )).to.eql({type: 'Feature', properties: {}, geometry: 4})
    })

    it('should filter specified fields (json)', () => {
      expect(formatOne(
        {outputFormat: 'json', fields: new Set(['a', 'c'])},
        {a: 1, b: 2, c: 3, d: 4}
      )).to.eql({a: 1, c: 3})
    })

    it('should filter specified fields (geojson)', () => {
      expect(formatOne(
        {
          query: {},
          outputFormat: 'geojson',
          geometry: 'x',
          fields: new Set(['a', 'c'])
        },
        {a: 1, b: 2, c: 3, x: 4, y: 6}
      )).to.eql({type: 'Feature', properties: {a: 1, c: 3}, geometry: 4})
    })

    it('should inject departement item', () => {
      expect(formatOne(
        {
          db: {departements: {search: criteria => [{code: criteria.code, nom: 'foo'}]}},
          query: {},
          fields: new Set(['a', 'departement'])
        },
        {a: 1, b: 2, codeDepartement: 12}
      )).to.eql({a: 1, departement: {code: 12, nom: 'foo'}})
    })

    it('should inject region item', () => {
      expect(formatOne(
        {
          db: {regions: {search: criteria => [{code: criteria.code, nom: 'foo'}]}},
          query: {},
          fields: new Set(['a', 'region'])
        },
        {a: 1, b: 2, codeRegion: 44}
      )).to.eql({a: 1, region: {code: 44, nom: 'foo'}})
    })
  })
})
