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
          expect(db.inseeIndex.get('11')).to.eql(region1);
        });
      });
      describe('index size', function () {
        it('should be equals to number of different values (3)', function () {
          expect(Array.from(db.inseeIndex.keys())).to.have.length(3);
        });
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
      it('should return an array with 1 region', function () {
        expect(db.queryByCode('11')).to.eql([region1]);
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
