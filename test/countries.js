/* eslint-env mocha */
const expect = require('expect.js');
const countries = require('../lib/countries');
const { cloneDeep } = require('lodash');

describe('countries', function () {
  let db;
  const country1 = { nom: 'one', code: '11' };
  const country2 = { nom: 'two', code: '22' };
  const country3 = { nom: 'three', code: '33' };

  beforeEach(done => {
    db = countries.getIndexedDb({ countries: [country1, country2, country3].map(cloneDeep) });
    done();
  });

  describe('getIndexedDb()', function () {
    describe('bad countries db path', function () {
      it('should throw an error', function () {
        expect(() => countries.getIndexedDb({ countriesDbPath: '_' })).to.throwError();
      });
    });
  });

  describe('indexes', function () {
    describe('indexes list', function () {
      const db = countries.getIndexedDb({ countries: [] });
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
        expect(db.search()).to.eql([country1, country2, country3]);
      });
    });
    describe('Simple matching criteria', function () {
      it('should return an array with 1 country', function () {
        expect(db.search({ code: '11' })).to.eql([country1]);
      });
    });
    describe('Disjoint criteria', function () {
      it('should return an empty array', function () {
        expect(db.search({ nom: 'three', code: '22' })).to.eql([]);
      });
    });
    describe('All criteria', function () {
      it('should return an array with 1 country', function () {
        expect(db.search({ nom: 'three', code: '33' })).to.eql([
          { nom: 'three', code: '33', _score: 1 },
        ]);
        db.search({ nom: 'three', code: '33' }).forEach(reg => {
          expect(reg).to.have.key('_score');
          expect(reg._score >= 0).to.be.ok();
        });
      });
    });
  });

});
