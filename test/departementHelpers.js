/* eslint-env mocha */
const expect = require('expect.js')
const {initDepartementFields} = require('../lib/departementHelpers')

describe('departementHelpers', () => {
  describe('initDepartementFields()', () => {
    function runTestCase(reqParams, expectedFields, done) {
      const req = {query: reqParams.query ? reqParams.query : {}}
      initDepartementFields(req, undefined, err => {
        expect(err).to.be(undefined)
        expect(req.fields).to.be.a(Set)
        expect([...req.fields].sort()).to.eql(expectedFields.sort())
        done()
      })
    }

    // 3 tests volontairement identiques en attendant les futures évolutions
    it('empty request should return default fields', done => {
      runTestCase(
        {},
        ['nom', 'code', 'codeRegion'],
        done
      )
    })

    it('fields should be read from query', done => {
      runTestCase(
        {query: {fields: 'nom,code,codeRegion'}},
        ['nom', 'code', 'codeRegion'],
        done
      )
    })

    it('`nom` and `code` should always be present', done => {
      runTestCase(
        {query: {fields: 'nom'}},
        ['nom', 'code'],
        done
      )
    })
  })
})
