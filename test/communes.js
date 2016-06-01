/* eslint-env mocha */
const expect = require('expect.js');
const communes = require('../lib/communes');

const fakeGeom = { type: 'Dumb', coordinates: [] };

describe('communes', function () {

  describe('getIndexedDb()', function () {
    describe('bad communes db path', function () {
      it('should throw an error', function () {
        expect(() => communes.getIndexedDb({ communesDbPath: '_' })).to.throwError();
      });
    });

    describe('cpIndex', function () {
      const db = communes.getIndexedDb({ communes: [
        { nom: 'abc', codeInsee: '12345', codesPostaux: ['00000', '11111'], centre: fakeGeom, contour: fakeGeom },
        { nom: 'def', codeInsee: '23456', codesPostaux: ['11111'], centre: fakeGeom, contour: fakeGeom },
      ]});
      describe('Unknown codePostal', function () {
        it('should not match', function () {
          expect(db.cpIndex.has('22222')).not.to.be.ok();
        });
      });
      describe('codePostal in 1 commune', function () {
        it('should match', function () {
          expect(db.cpIndex.has('00000')).to.be.ok();
        });
        it('should return 1 entry', function () {
          expect(db.cpIndex.get('00000').length).to.be(1);
        });
      });
      describe('codePostal in 2 communes', function () {
        it('should match', function () {
          expect(db.cpIndex.has('11111')).to.be.ok();
        });
        it('should return 2 entries', function () {
          expect(db.cpIndex.get('11111').length).to.be(2);
        });
      });
      describe('index size', function () {
        it('should be equals to number of different values (2)', function () {
          expect(Array.from(db.cpIndex.keys()).length).to.be(2);
        });
      });
    });

  });

});
