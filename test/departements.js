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

    describe('regionIndex', function () {
      describe('Unknown codeRegion', function () {
        it('should not match', function () {
          expect(db.regionIndex.has('22')).not.to.be.ok();
        });
      });
      describe('region with 1 departement', function () {
        it('should match', function () {
          expect(db.regionIndex.has('00')).to.be.ok();
        });
        it('should return 1 entry', function () {
          expect(db.regionIndex.get('00')).to.have.length(1);
        });
      });
      describe('region with 2 departements', function () {
        it('should match', function () {
          expect(db.regionIndex.has('11')).to.be.ok();
        });
        it('should return 2 entries', function () {
          expect(db.regionIndex.get('11')).to.have.length(2);
        });
      });
      describe('index size', function () {
        it('should be equals to number of different values (2)', function () {
          expect(Array.from(db.regionIndex.keys())).to.have.length(2);
        });
      });
    });

    describe('inseeIndex', function () {
      describe('Unknown code', function () {
        it('should not match', function () {
          expect(db.inseeIndex.has('66')).not.to.be.ok();
        });
      });
      describe('Known code', function () {
        it('should match', function () {
          expect(db.inseeIndex.has('11')).to.be.ok();
        });
        it('should return 1 entry', function () {
          expect(db.inseeIndex.get('11')).to.eql(departement1);
        });
      });
      describe('index size', function () {
        it('should be equals to number of different values (3)', function () {
          expect(Array.from(db.inseeIndex.keys())).to.have.length(3);
        });
      });
    });

  });

  describe('queryByCodeRegion()', function () {
    describe('Unknown codeRegion', function () {
      it('should return an empty array', function () {
        expect(db.queryByCodeRegion('22')).to.eql([]);
      });
    });
    describe('codeRegion present in 1 departement', function () {
      it('should return an array with 1 departement', function () {
        expect(db.queryByCodeRegion('00')).to.eql([departement1]);
      });
    });
    describe('codeRegion present in 2 departements', function () {
      it('should return an array with 2 departements', function () {
        expect(db.queryByCodeRegion('11')).to.eql([departement2, departement3]);
      });
    });
  });

  describe('queryByCode()', function () {
    describe('Unknown code', function () {
      it('should return an empty array', function () {
        expect(db.queryByCode('00')).to.eql([]);
      });
    });
    describe('Known code', function () {
      it('should return an array with 1 departement', function () {
        expect(db.queryByCode('11')).to.eql([departement1]);
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
