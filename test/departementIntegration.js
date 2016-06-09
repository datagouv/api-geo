/* eslint-env mocha */
const { init, serialize, loadDepartements } = require('../lib/integration/departements');
const expect = require('expect.js');

describe('#integration departements', () => {

  describe('init()', () => {
    let ctx;
    beforeEach(done => {
      ctx = {};
      init(ctx, done);
    });

    describe('Context setup', () => {
      it('should set ctx.departements as an empty Map', () => {
        expect(ctx.departements).to.be.a(Map);
        expect(ctx.departements.size).to.be(0);
      });
      it('should set ctx.getDepartement function',
        () => expect(ctx.getDepartement).to.be.a(Function));
    });

    describe('getDepartement()', () => {
      describe('New departement', () => {
        beforeEach(() => {
          expect(ctx.departements.size).to.be(0);
        });
        it('should return a departement with given code', () => {
          const departement = ctx.getDepartement('42');
          expect(departement).to.be.an(Object);
          expect(departement).to.only.have.keys('code');
          expect(departement.code).to.be('42');
        });
        it('should store the departement', () => {
          ctx.getDepartement('21');
          expect(ctx.departements.size).to.be(1);
          expect(ctx.departements.has('21')).to.be.ok();
          const departement = ctx.departements.get('21');
          expect(departement).to.only.have.keys('code');
          expect(departement.code).to.be('21');
        });
      });

      describe('Existing departement', () => {
        beforeEach(() => {
          ctx.getDepartement('11');
          expect(ctx.departements.size).to.be(1);
        });
        it('should return a departement with given code', () => {
          const departement = ctx.getDepartement('11');
          expect(departement).to.be.an(Object);
          expect(departement).to.only.have.keys('code');
          expect(departement.code).to.be('11');
        });
        it('should have no impact on storage', () => {
          ctx.getDepartement('11');
          expect(ctx.departements.has('11')).to.be.ok();
          expect(ctx.departements.size).to.be(1);
        });
      });
    });
  });

  describe('loadDepartements()', () => {
    let ctx;
    let departement;
    beforeEach(() => {
      departement = { };
      ctx = {
        debug: () => {},
        getDepartement: code => {
          departement.code = code;
          return departement;
        },
      };
    });

    describe('Processing a file containing 1 departement', () => {
      it('should store 1 departement', done => {
        loadDepartements({ srcPath: __dirname + '/integration-data/departements.tsv' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(departement).to.eql({code: '42',codeRegion: '21',nom: 'Test'});
          done();
        });
      });
    });
  });

  describe('serialize()', () => {
    describe('No departement', () => {
      it('should throw an error', done => {
        const ctx = { debug: () => {}, departements: new Map() };
        serialize()(ctx, err => {
          expect(err).to.be.an(Error);
          expect(err.message).to.be('No departements');
          done();
        });
      });
    });

    describe('One departement', () => {
      it('should generate a JSON file with one departement inside', done => {
        const ctx = { debug: () => {}, departements: new Map([
          ['42', {
            code: '42',
            nom: 'Test',
            codeRegion: '24',
          }],
        ]) };
        serialize({ destPath: __dirname + '/../data/test-serialize-departement.json' })(ctx, err => {
          expect(err).to.be(undefined);
          const departements = require('../data/test-serialize-departement.json');
          expect(departements).to.have.length(1);
          expect(departements[0]).to.eql({
            code: '42',
            nom: 'Test',
            codeRegion: '24',
          });
          done();
        });
      });
    });
  });
});
