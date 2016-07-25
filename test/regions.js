/* eslint-env mocha */
const expect = require('expect.js');
const regions = require('../lib/regions');
const { cloneDeep } = require('lodash');

describe('regions', function () {
  let db;
  const region1 = { nom: 'one', code: '11' };
  const region2 = { nom: 'two', code: '22' };
  const region3 = { nom: 'three', code: '33' };

  beforeEach(done => {
    db = regions.getIndexedDb({ regions: [region1, region2, region3].map(cloneDeep) });
    done();
  });

  describe('getIndexedDb()', function () {
    describe('bad regions db path', function () {
      it('should throw an error', function () {
        expect(() => regions.getIndexedDb({ regionsDbPath: '_' })).to.throwError();
      });
    });
  });

  describe('indexes', function () {
    describe('indexes list', function () {
      const db = regions.getIndexedDb({ regions: [] });
      [
        'nom',
        'code',
      ].forEach(index => {
        it(`should contain '${index}' index`, () => {
          expect(db._indexes).to.have.key(index);
        });
      });
    });
  });

  describe('search()', function () {
    describe('No criteria', function () {
      it('should return everything', function () {
        expect(db.search()).to.eql([region1, region2, region3]);
      });
    });
    describe('Simple matching criteria', function () {
      it('should return an array with 1 region', function () {
        expect(db.search({ code: '11' })).to.eql([region1]);
      });
    });
    describe('Disjoint criteria', function () {
      it('should return an empty array', function () {
        expect(db.search({ nom: 'three', code: '22' })).to.eql([]);
      });
    });
    describe('All criteria', function () {
      it('should return an array with 1 region', function () {
        expect(db.search({ nom: 'three', code: '33' })).to.eql([
          { nom: 'three', code: '33', _score: 1 },
        ]);
      });
    });
  });

});
