/* eslint-env mocha */
const expect = require('expect.js');
const departements = require('../lib/departements');
const { cloneDeep } = require('lodash');

describe('departements', function () {
  let db;
  const departement1 = { nom: 'one', code: '11', codeRegion: '00' };
  const departement2 = { nom: 'two', code: '22', codeRegion: '11' };
  const departement3 = { nom: 'three', code: '33', codeRegion: '11' };

  beforeEach(done => {
    db = departements.getIndexedDb({ departements: [departement1, departement2, departement3].map(cloneDeep) });
    done();
  });

  describe('getIndexedDb()', function () {
    describe('bad departements db path', function () {
      it('should throw an error', function () {
        expect(() => departements.getIndexedDb({ departementsDbPath: '_' })).to.throwError();
      });
    });
  });

  describe('indexes', function () {
    describe('indexes list', function () {
      const db = departements.getIndexedDb({ departements: [] });
      [
        'nom',
        'code',
        'codeRegion',
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
        expect(db.search()).to.eql([departement1, departement2, departement3]);
      });
    });
    describe('Simple matching criteria', function () {
      it('should return an array with 1 departement', function () {
        expect(db.search({ code: '11' })).to.eql([departement1]);
      });
    });
    describe('Disjoint criteria', function () {
      it('should return an empty array', function () {
        expect(db.search({ code: '22', codeRegion: '00' })).to.eql([]);
      });
    });
    describe('Intersecting criteria (1 departement)', function () {
      it('should return an array with 1 departement', function () {
        expect(db.search({ code: '33', codeRegion: '11' })).to.eql([departement3]);
      });
    });
    describe('All criteria', function () {
      it('should return an array with 1 departement', function () {
        expect(db.search({ nom: 'three', code: '33', codeRegion: '11' })).to.eql([
          { nom: 'three', code: '33', codeRegion: '11', _score: 1 },
        ]);
      });
    });
  });

});
