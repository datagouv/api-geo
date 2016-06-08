/* eslint-env mocha */
const { init, loadCommunes, loadCodePostaux, serialize } = require('../lib/integration');
const pipeline = require('../lib/integration/pipeline');
const expect = require('expect.js');


describe('#integration communes', () => {

  describe('init()', () => {
    let ctx;
    beforeEach(done => {
      ctx = {};
      init(ctx, done);
    });

    describe('Context setup', () => {
      it('should set ctx.communes as an empty Map', () => {
        expect(ctx.communes).to.be.a(Map);
        expect(ctx.communes.size).to.be(0);
      });
      it('should set ctx.getByCodeInsee function',
        () => expect(ctx.getByCodeInsee).to.be.a(Function));
    });

    describe('getByCodeInsee()', () => {
      describe('New commune', () => {
        beforeEach(() => {
          expect(ctx.communes.size).to.be(0);
        });
        it('should return a commune with given codeInsee', () => {
          const commune = ctx.getByCodeInsee('12345');
          expect(commune).to.be.an(Object);
          expect(commune).to.only.have.keys('codeInsee', 'codesPostaux');
          expect(commune.codeInsee).to.be('12345');
        });
        it('should store the commune', () => {
          ctx.getByCodeInsee('23456');
          expect(ctx.communes.size).to.be(1);
          expect(ctx.communes.has('23456')).to.be.ok();
          const commune = ctx.communes.get('23456');
          expect(commune).to.only.have.keys('codeInsee', 'codesPostaux');
          expect(commune.codeInsee).to.be('23456');
        });
      });

      describe('Existing commune', () => {
        beforeEach(() => {
          ctx.getByCodeInsee('11111');
          expect(ctx.communes.size).to.be(1);
        });
        it('should return a commune with given codeInsee', () => {
          const commune = ctx.getByCodeInsee('11111');
          expect(commune).to.be.an(Object);
          expect(commune).to.only.have.keys('codeInsee', 'codesPostaux');
          expect(commune.codeInsee).to.be('11111');
        });
        it('should have no impact on storage', () => {
          ctx.getByCodeInsee('11111');
          expect(ctx.communes.has('11111')).to.be.ok();
          expect(ctx.communes.size).to.be(1);
        });
      });
    });
  });

  describe('loadCommunes()', () => {
    let ctx;
    let commune;
    beforeEach(() => {
      commune = { codesPostaux: new Set() };
      ctx = {
        debug: () => {},
        getByCodeInsee: codeInsee => {
          commune.codeInsee = codeInsee;
          return commune;
        },
      };
    });

    describe('Processing a file containing 1 commune', () => {
      it('should store 1 commune', done => {
        loadCommunes({ srcPath: __dirname + '/integration-data/communes.json' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(commune).to.only.have.keys('codeInsee', 'codesPostaux', 'surface', 'centre', 'contour', 'nom');
          expect(commune.codeInsee).to.be('11220');
          expect(commune.nom).to.be('Marseillette');
          expect(commune.surface).to.be(801);
          expect(commune.codesPostaux.size).to.be(0);
          expect(commune.centre.type).to.be('Point');
          expect(commune.contour.type).to.be('Polygon');
          done();
        });
      });
    });
  });

  describe('loadCodePostaux()', () => {
    describe('Processing a file containing a relation with known code INSEE', () => {
      it('should associate the code postal to the commune', done => {
        const commune = { codesPostaux: new Set() };
        const ctx = {
          communes: { has: () => true },
          debug: () => {},
          getByCodeInsee: codeInsee => {
            commune.codeInsee = codeInsee;
            return commune;
          },
        };
        loadCodePostaux({ srcPath: __dirname + '/integration-data/cp.json' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(commune).to.only.have.keys('codeInsee', 'codesPostaux');
          expect(commune.codeInsee).to.be('11220');
          expect(Array.from(commune.codesPostaux)).to.eql(['11800']);
          done();
        });
      });
    });

    describe('Ignore some code INSEE classes', () => {
      [
        { className: 'Polynésie', file: 'polynesie-cp.json' },
        { className: 'Monaco', file: 'monaco-cp.json' },
      ].forEach(testCase => {
        describe(`Processing a file containing a relation with ${testCase.className}`, () => {
          it('should be ignored', done => {
            const ctx = { debug: () => {} };
            loadCodePostaux({ srcPath: `${__dirname}/integration-data/${testCase.file}` })(ctx, err => {
              expect(err).to.be(undefined);
              done();
            });
          });
        });
      });
    });

    describe('Rewrite Paris/Marseille/Lyon arrondissements INSEE code', () => {
      describe('Processing a file containing entries for each métropole arrondissement', () => {
        it('code INSEE should be rewritten for each entry', done => {
          const codes = [];
          const ctx = {
            debug: () => {},
            communes: { has: () => false },
            getByCodeInsee: codeInsee => {
              codes.push(codeInsee);
              return { codesPostaux: new Set() };
            },
          };
          loadCodePostaux({ srcPath: `${__dirname}/integration-data/arrondissements-cp.json` })(ctx, err => {
            expect(err).to.be(undefined);
            expect(codes).to.eql(['13055', '75056', '69123']);
            done();
          });
        });
      });
    });

    describe('Processing an entry with an unknown code INSEE', () => {
      it('entry should be ignored', done => {
        const ctx = {
          debug: () => {},
          communes: { has: () => false },
        };
        loadCodePostaux({ srcPath: __dirname + '/integration-data/unknown-cp.json' })(ctx, err => {
          expect(err).to.be(undefined);
          done();
        });
      });
    });
  });

  describe('serialize()', () => {
    describe('No commune', () => {
      it('should throw an error', done => {
        const ctx = { debug: () => {}, communes: new Map() };
        serialize()(ctx, err => {
          expect(err).to.be.an(Error);
          expect(err.message).to.be('No commune');
          done();
        });
      });
    });

    describe('One commune', () => {
      it('should generate a JSON file with one commune inside', done => {
        const ctx = { debug: () => {}, communes: new Map([
          ['12345', {
            codeInsee: '12345',
            nom: 'Ville-sur-Loire',
            codesPostaux: new Set(['11111', '22222']),
          }],
        ]) };
        serialize({ destPath: __dirname + '/../data/test-serialize-commune.json' })(ctx, err => {
          expect(err).to.be(undefined);
          const communes = require('../data/test-serialize-commune.json');
          expect(communes).to.have.length(1);
          expect(communes[0]).to.eql({
            codeInsee: '12345',
            nom: 'Ville-sur-Loire',
            codesPostaux: ['11111', '22222'],
          });
          done();
        });
      });
    });
  });
});

describe('#pipeline', () => {
  describe('Empty pipeline', () => {
    it('should just call the callback', done => {
      pipeline([], done);
    });
  });
  describe('One stage pipeline', () => {
    it('context should be present', done => {
      pipeline([(ctx, next) => {
        expect(ctx).to.only.have.keys('debug');
        next();
      }], done);
    });
  });
  describe('Two stage pipeline', () => {
    it('should pass in each stage', done => {
      let passedStages = 0;
      pipeline([
        (ctx, next) => {
          passedStages++;
          next();
        },
        (ctx, next) => {
          passedStages++;
          next();
        },
      ], err => {
        expect(err).not.to.be.ok();
        expect(passedStages).to.be(2);
        done();
      });
    });
    it('context should be the same object', done => {
      let firstCtx;
      pipeline([
        (ctx, next) => {
          firstCtx = ctx;
          next();
        },
        (ctx, next) => {
          expect(ctx).to.be(firstCtx);
          next();
        },
      ], done);
    });
  });
});
