/* eslint-env mocha */
const expect = require('expect.js');
const { initCountryFields } = require('../lib/countryHelpers');

describe('countryHelpers', function () {

  describe('initCountryFields()', function () {
    function runTestCase(reqParams, expectedFields, done) {
      const req = { query: reqParams.query ? reqParams.query : {} };
      initCountryFields(req, undefined, function (err) {
        expect(err).to.be(undefined);
        expect(req.fields).to.be.a(Set);
        expect(Array.from(req.fields).sort()).to.eql(expectedFields.sort());
        done();
      });
    }

    // 3 tests volontairement identiques en attendant les futures évolutions
    it('empty request should return default fields', function (done) {
      runTestCase(
        {},
        ['nom', 'code', 'iso2', 'iso3', 'num', 'territories'],
        done
      );
    });

    it('fields should be read from query', function (done) {
      runTestCase(
        { query: { fields: 'nom,code' } },
        ['nom', 'code'],
        done
      );
    });

    it('`nom` and `code` should always be present', function (done) {
      runTestCase(
        { query: { fields: 'nom' } },
        ['nom', 'code'],
        done
      );
    });
  });

});
