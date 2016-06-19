/* eslint-env mocha */
const expect = require('expect.js');
const { initCommuneFields, initCommuneFormat } = require('../lib/communeHelpers');

describe('communeHelpers', function () {

  describe('initCommuneFields()', function () {
    function runTestCase(reqParams, expectedFields, done) {
      const req = { query: reqParams.query ? reqParams.query : {} };
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
        ['nom', 'code', 'codesPostaux', 'codeDepartement', 'codeRegion', 'population'],
        done
      );
    });

    it('fields should be read from query', function (done) {
      runTestCase(
        { query: { fields: 'nom,code,centre' } },
        ['nom', 'code', 'centre'],
        done
      );
    });

    it('`nom` and `code` should always be present', function (done) {
      runTestCase(
        { query: { fields: 'contour' } },
        ['nom', 'code', 'contour'],
        done
      );
    });
  });

  describe('initCommuneFormat()', function () {
    it('default format should be `json`', function (done) {
      const req = { query: {}, fields: new Set() };
      initCommuneFormat(req, undefined, function (err) {
        expect(err).to.be(undefined);
        expect(req.outputFormat).to.be('json');
        done();
      });
    });

    ['json', 'geojson'].forEach(function (format) {
      it('`' + format + '` should be an accepted format', function (done) {
        const req = { query: { format }, fields: new Set() };
        initCommuneFormat(req, undefined, function (err) {
          expect(err).to.be(undefined);
          expect(req.outputFormat).to.be(format);
          done();
        });
      });
    });

    it('`contour` and `centre` should be removed from fields when in `geojson`', function (done) {
      const req = { query: { format: 'geojson' }, fields: new Set(['code', 'centre', 'contour']) };
      initCommuneFormat(req, undefined, function (err) {
        expect(err).to.be(undefined);
        expect(req.outputFormat).to.be('geojson');
        expect(req.fields).to.be.a(Set);
        expect(Array.from(req.fields).sort()).to.eql(['code'].sort());
        done();
      });
    });

    it('`contour` and `centre` should be kept in fields when in `json`', function (done) {
      const req = { query: { format: 'json' }, fields: new Set(['code', 'centre', 'contour']) };
      initCommuneFormat(req, undefined, function (err) {
        expect(err).to.be(undefined);
        expect(req.outputFormat).to.be('json');
        expect(req.fields).to.be.a(Set);
        expect(Array.from(req.fields).sort()).to.eql(['code', 'centre', 'contour'].sort());
        done();
      });
    });
  });

});
