/* eslint-env mocha */
const expect = require('expect.js');
const { initCommuneFields } = require('../lib/communeHelpers');

describe('communeHelpers', function () {

  describe('initCommuneFields()', function () {
    function runTestCase(reqParams, expectedFields, done) {
      const req = { query: reqParams.query ? reqParams.query : {}};
      initCommuneFields(req, undefined, function (err) {
        expect(err).to.be(undefined);
        expect(req.fields).to.be.a(Set);
        expect(Array.from(req.fields).sort()).to.eql(expectedFields.sort());
        done();
      });
    }

    it('empty request should return default fields', function (done) {
      runTestCase(
        {},
        ['nom', 'codeInsee', 'codesPostaux', 'centre', 'surface'],
        done
      );
    });

    it('fields should be read from query', function (done) {
      runTestCase(
        { query: { fields: 'nom,codeInsee,centre' } },
        ['nom', 'codeInsee', 'centre'],
        done
      );
    });

    it('`nom` and `codeInsee` should always be present', function (done) {
      runTestCase(
        { query: { fields: 'contour' } },
        ['nom', 'codeInsee', 'contour'],
        done
      );
    });
  });

});
