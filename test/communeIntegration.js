/* eslint-env mocha */
const { isIgnoredCommune, init, loadGeometries, loadCommunes, loadCodePostaux, serialize, checkCommunes } = require('../lib/integration/communes');
const expect = require('expect.js');


describe('#integration communes', () => {

  describe('isIgnoredCommune()', () => {
    const codes = {
      '98001': true, // Polynésie
      '99001': true, // Monaco
      '97501': true, // Saint-Pierre-et-Miquelon
      '97701': true, // Saint-Barthelemy
      '12345': false, // Normal
    };
    for (let code in codes) {
      const expectedValue = codes[code];
      it('should return ' + expectedValue + ' for ' + code, () => {
        expect(isIgnoredCommune(code)).to.be(expectedValue);
      });
    }
  });

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
      it('should set ctx.getCommune function',
        () => expect(ctx.getCommune).to.be.a(Function));
    });

    describe('createCommune()', () => {
      describe('New commune', () => {
        beforeEach(() => {
          expect(ctx.communes.size).to.be(0);
        });
        it('should return a commune with given code', () => {
          const commune = ctx.createCommune('12345');
          expect(commune).to.be.an(Object);
          expect(commune).to.only.have.keys('code', 'codesPostaux', 'communesMembres');
          expect(commune.code).to.be('12345');
        });
        it('should store the commune', () => {
          ctx.createCommune('23456');
          expect(ctx.communes.size).to.be(1);
          expect(ctx.communes.has('23456')).to.be.ok();
          const commune = ctx.communes.get('23456');
          expect(commune).to.only.have.keys('code', 'codesPostaux', 'communesMembres');
          expect(commune.code).to.be('23456');
        });
      });

      describe('Existing commune', () => {
        beforeEach(() => ctx.communes.set('99999', {}));

        it('should throw an exception', () => {
          expect(() => ctx.createCommune('99999')).to.throwError();
        });
        it('should have no impact on storage', () => {
          try {
            ctx.createCommune('99999');
          } catch (err) {
            // Do nothing
          }
          expect(ctx.communes.has('99999')).to.be.ok();
          expect(ctx.communes.size).to.be(1);
        });
      });
    });

    describe('getCommune()', () => {
      describe('Unknown commune', () => {
        it('should throw an exception', () => {
          expect(ctx.communes.size).to.be(0);
          expect(() => ctx.getCommune('99999')).to.throwError();
        });
      });

      describe('Known commune', () => {
        beforeEach(() => {
          ctx.communes.set('11111', 'tralala');
          expect(ctx.communes.size).to.be(1);
        });
        it('should return the commune', () => {
          const commune = ctx.getCommune('11111');
          expect(commune).to.be('tralala');
        });
        it('should have no impact on storage', () => {
          ctx.getCommune('11111');
          expect(ctx.communes.has('11111')).to.be.ok();
          expect(ctx.communes.size).to.be(1);
        });
      });
    });

    describe('hasCommune()', () => {
      describe('Unknown commune', () => {
        it('should return false', () => {
          expect(ctx.communes.size).to.be(0);
          expect(ctx.hasCommune('99999')).to.be(false);
        });
      });

      describe('Known commune', () => {
        beforeEach(() => {
          ctx.communes.set('11111', 'tralala');
          expect(ctx.communes.size).to.be(1);
        });
        it('should return true', () => {
          expect(ctx.hasCommune('11111')).to.be(true);
        });
      });
    });

    describe('getOrCreateCommune()', () => {
      describe('New commune', () => {
        beforeEach(() => {
          expect(ctx.communes.size).to.be(0);
        });
        it('should return a commune with given code', () => {
          const commune = ctx.getOrCreateCommune('12345');
          expect(commune).to.be.an(Object);
          expect(commune).to.only.have.keys('code', 'codesPostaux', 'communesMembres');
          expect(commune.code).to.be('12345');
        });
        it('should store the commune', () => {
          ctx.getOrCreateCommune('23456');
          expect(ctx.communes.size).to.be(1);
          expect(ctx.communes.has('23456')).to.be.ok();
          const commune = ctx.communes.get('23456');
          expect(commune).to.only.have.keys('code', 'codesPostaux', 'communesMembres');
          expect(commune.code).to.be('23456');
        });
      });

      describe('Existing commune', () => {
        beforeEach(() => ctx.communes.set('99999', 'tralala'));

        it('should return the commune', () => {
          expect(ctx.getOrCreateCommune('99999')).to.be('tralala');
        });
        it('should have no impact on storage', () => {
          ctx.getOrCreateCommune('99999');
          expect(ctx.communes.has('99999')).to.be.ok();
          expect(ctx.communes.size).to.be(1);
        });
      });
    });

    describe('getCommuneActuelle()', () => {
      describe('Commune actuelle', () => {
        it('doit retourner la commune demandée', () => {
          ctx.communes.set('11111', { code: '11111' });
          expect(ctx.getCommuneActuelle('11111').code).to.be('11111');
        });
      });
      describe('Ancienne commune sans commune de rattachement', () => {
        it('should throw an error', () => {
          ctx.communes.set('22222', { code: '22222', ancienne: true });
          expect(() => ctx.getCommuneActuelle('22222')).to.throwError();
        });
      });
      describe('Ancienne commune avec commune de rattachement', () => {
        it('doit retourner la commune de rattachement', () => {
          const communeMembre = { code: '22222' };
          const communeActuelle = { code: '11111', communesMembres: new Set([communeMembre]) };
          communeMembre.communeRattachement = communeActuelle;
          ctx.communes.set('11111', communeActuelle);
          ctx.communes.set('22222', communeMembre);
          expect(ctx.getCommuneActuelle('22222').code).to.be('11111');
        });
      });
    });
  });

  describe('loadGeometries()', () => {
    let ctx;
    let commune;
    beforeEach(() => {
      commune = { codesPostaux: new Set() };
      ctx = {
        debug: () => {},
        hasCommune: () => true,
        getCommune: code => {
          commune.code = code;
          return commune;
        },
      };
    });

    describe('Processing a file containing 1 commune', () => {
      it('should store 1 commune', done => {
        loadGeometries({ srcPath: __dirname + '/integration-data/communes.json' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(commune).to.only.have.keys('code', 'codesPostaux', 'surface', 'centre', 'contour');
          expect(commune.code).to.be('11220');
          expect(commune.surface).to.be(801);
          expect(commune.codesPostaux.size).to.be(0);
          expect(commune.centre.type).to.be('Point');
          expect(commune.contour.type).to.be('Polygon');
          done();
        });
      });
    });
  });

  describe('loadCommunes()', () => {
    let ctx;
    let commune;
    beforeEach(() => {
      commune = {};
      ctx = {
        debug: () => {},
        hasCommune: () => false,
        getOrCreateCommune: code => {
          commune.code = code;
          return commune;
        },
      };
    });

    describe('Processing a file containing 1 commune', () => {
      it('should store 1 commune', done => {
        loadCommunes({ srcPath: __dirname + '/integration-data/communes.tsv' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(commune).to.eql({ code: '01001', codeDepartement: '01', codeRegion: '84',nom: 'Abergement-Clémenciat' });
          done();
        });
      });
    });

    describe('Processing a file containing 1 commune (DROM)', () => {
      it('should store 1 commune', done => {
        loadCommunes({ srcPath: __dirname + '/integration-data/communes-drom.tsv' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(commune).to.eql({ code: '97101', codeDepartement: '971', codeRegion: '01',nom: 'Abergement-Clémenciat' });
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
          hasCommune: () => true,
          getCommuneActuelle: code => {
            commune.code = code;
            return commune;
          },
        };
        loadCodePostaux({ srcPath: __dirname + '/integration-data/cp.json' })(ctx, err => {
          expect(err).to.be(undefined);
          expect(commune).to.only.have.keys('code', 'codesPostaux');
          expect(commune.code).to.be('11220');
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
            hasCommune: () => false,
            getCommuneActuelle: code => {
              codes.push(code);
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
          hasCommune: () => false,
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
            code: '12345',
            nom: 'Ville-sur-Loire',
            codesPostaux: new Set(['22222', '11111']),
          }],
        ]) };
        serialize({ destPath: __dirname + '/../data/test-serialize-commune.json' })(ctx, err => {
          expect(err).to.be(undefined);
          const communes = require('../data/test-serialize-commune.json');
          expect(communes).to.have.length(1);
          expect(communes[0]).to.eql({
            code: '12345',
            nom: 'Ville-sur-Loire',
            codesPostaux: ['11111', '22222'], // Exact order
          });
          done();
        });
      });
    });
  });

  describe('checkCommunes()', () => {
    describe('No arguments missing', () => {
      it('should keep commune', done => {
        const ctx = { debug: () => {}, communes: new Map([
          ['12345', {
            code: '12345',
            nom: 'Ville-sur-Loire',
            codeDepartement: '11',
            contour: { type: 'Polygon', coordinates: [[Object]] },
            codesPostaux: new Set(['11111', '22222']),
          }],
        ]) };
        expect(ctx.communes.size).to.be(1);
        checkCommunes()(ctx, err => {
          expect(err).to.be(undefined);
          expect(ctx.communes.size).to.be(1);
          done();
        });
      });
    });

    describe('No contour', () => {
      it('should store commune', done => {
        const ctx = { debug: () => {}, communes: new Map([
          ['12345', {
            code: '12345',
            nom: 'Ville-sur-Loire',
            codeDepartement: '11',
            codesPostaux: new Set(['11111', '22222']),
          }],
        ]) };
        expect(ctx.communes.size).to.be(1);
        checkCommunes()(ctx, err => {
          expect(err).to.be(undefined);
          expect(ctx.communes.size).to.be(1);
          done();
        });
      });
    });

    describe('No codeDepartement', () => {
      it('should store commune', done => {
        const ctx = { debug: () => {}, communes: new Map([
          ['12345', {
            code: '12345',
            nom: 'Ville-sur-Loire',
            contour: { type: 'Polygon', coordinates: [[Object]] },
            codesPostaux: new Set(['11111', '22222']),
          }],
        ]) };
        expect(ctx.communes.size).to.be(1);
        checkCommunes()(ctx, err => {
          expect(err).to.be(undefined);
          expect(ctx.communes.size).to.be(1);
          done();
        });
      });
    });

    describe('No codesPostaux', () => {
      it('should delete commune', done => {
        const ctx = { debug: () => {}, communes: new Map([
          ['12345', {
            code: '12345',
            nom: 'Ville-sur-Loire',
            codeDepartement: '11',
            contour: { type: 'Polygon', coordinates: [[Object]] },
            codesPostaux: new Set([]),
          }],
        ]) };
        expect(ctx.communes.size).to.be(1);
        checkCommunes()(ctx, err => {
          expect(err).to.be(undefined);
          expect(ctx.communes.size).to.be(0);
          done();
        });
      });
    });
  });
});
