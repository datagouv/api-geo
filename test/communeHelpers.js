/* eslint-env mocha */
const expect = require('expect.js')
const {initCommuneFields, initCommuneFormat} = require('../lib/communeHelpers')

describe('communeHelpers', () => {
  describe('initCommuneFields()', () => {
    function runTestCase(reqParams, expectedFields, done) {
      const req = {query: reqParams.query ? reqParams.query : {}}
      initCommuneFields(req, undefined, err => {
        expect(err).to.be(undefined)
        expect(req.fields).to.be.a(Set)
        expect([...req.fields].sort()).to.eql(expectedFields.sort())
        done()
      })
    }

    it('empty request should return default fields', done => {
      runTestCase(
        {},
        ['nom', 'code', 'codesPostaux', 'codeDepartement', 'codeRegion', 'population'],
        done
      )
    })

    it('fields should be read from query', done => {
      runTestCase(
        {query: {fields: 'nom,code,centre'}},
        ['nom', 'code', 'centre'],
        done
      )
    })

    it('`nom` and `code` should always be present', done => {
      runTestCase(
        {query: {fields: 'contour'}},
        ['nom', 'code', 'contour'],
        done
      )
    })
  })

  describe('initCommuneFormat()', () => {
    it('default format should be `json`', done => {
      const req = {query: {}, fields: new Set()}
      initCommuneFormat(req, undefined, err => {
        expect(err).to.be(undefined)
        expect(req.outputFormat).to.be('json')
        done()
      })
    });

    ['json', 'geojson'].forEach(format => {
      it('`' + format + '` should be an accepted format', done => {
        const req = {query: {format}, fields: new Set()}
        initCommuneFormat(req, undefined, err => {
          expect(err).to.be(undefined)
          expect(req.outputFormat).to.be(format)
          done()
        })
      })
    })

    it('`contour` and `centre` should be removed from fields when in `geojson`', done => {
      const req = {query: {format: 'geojson'}, fields: new Set(['code', 'centre', 'contour'])}
      initCommuneFormat(req, undefined, err => {
        expect(err).to.be(undefined)
        expect(req.outputFormat).to.be('geojson')
        expect(req.fields).to.be.a(Set)
        expect([...req.fields].sort()).to.eql(['code'].sort())
        done()
      })
    })

    it('`contour` and `centre` should be kept in fields when in `json`', done => {
      const req = {query: {format: 'json'}, fields: new Set(['code', 'centre', 'contour'])}
      initCommuneFormat(req, undefined, err => {
        expect(err).to.be(undefined)
        expect(req.outputFormat).to.be('json')
        expect(req.fields).to.be.a(Set)
        expect([...req.fields].sort()).to.eql(['code', 'centre', 'contour'].sort())
        done()
      })
    })
  })
})
