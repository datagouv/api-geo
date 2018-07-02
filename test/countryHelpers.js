/* eslint-env mocha */
const expect = require('expect.js')
const {initCountryFields} = require('../lib/countryHelpers')

describe('countryHelpers', () => {
  describe('initCountryFields()', () => {
    const runTestCase = (reqParams, expectedFields, done) => {
      const req = {query: reqParams.query ? reqParams.query : {}}
      initCountryFields(req, undefined, err => {
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
        ['nom', 'code', 'iso2', 'iso3', 'num', 'territories'],
        done
      )
    })

    it('fields should be read from query', done => {
      runTestCase(
        {query: {fields: 'nom,code'}},
        ['nom', 'code'],
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
