/* eslint-env mocha */
const { integrate } = require('../lib/integrate');
const fs = require('fs');
const expect = require('expect.js');


describe('integration', function() {

  describe('init paths', function() {
    it('should init all paths with default value', function() {
      const integration = integrate();
      expect(integration.paths.communesFilePath).to.exist;
      expect(integration.paths.codesPostauxFilePath).to.exist;
      expect(integration.paths.outputFilePath).to.exist;
    });
  });

  describe('getByCodeInsee()', function() {
    describe('set a new communes', function() {
      const integration = integrate();
      const codeInsee = '1234';
      expect(integration.communes.size).to.equal(0);
      it('should return codeInsee and store commune.', function() {
        const result = integration.getByCodeInsee(codeInsee);
        expect(result.codeInsee).to.equal(codeInsee);
        expect(result.codesPostaux).to.empty;
        expect(integration.communes.has(codeInsee)).to.true;
        expect(integration.communes.size).to.equal(1);
      });
    });

    describe('set a same commune twice', function() {
      const integration = integrate();
      const codeInsee = '1234';
      integration.getByCodeInsee(codeInsee);
      expect(integration.communes.size).to.equal(1);
      it('should return codeInsee but not store commune.', function() {
        const result = integration.getByCodeInsee(codeInsee);
        expect(result.codeInsee).to.equal(codeInsee);
        expect(result.codesPostaux).to.empty;
        expect(integration.communes.has(codeInsee)).to.true;
        expect(integration.communes.size).to.equal(1);
      });
    });
  });

  describe('loadCommunes()', function() {
    describe('bad file path', function() {
      it('should thrown an error', function(done) {
        integrate({ communesFilePath: '_' }).loadCommunes()
          .then(function(data) {
            expect(data).to.be.undefined;
            done();
          }).catch(function(error) {
            expect(error.code).to.equal('ENOENT');
            done();
          });
      });
    });

    describe('good file path', function() {
      it('should return the number of loaded communes.', function(done) {
        const options = {communesFilePath: __dirname + '/integration-data/communes.json'};
        const integration = integrate(options);
        integration.loadCommunes()
          .then(function(data) {
            expect(data).to.equal(1);
            done();
          }).catch(function(error) {
            done(error);
          });
      });
    });
  });

  describe('loadCodePostaux()', function() {
    describe('bad file path', function() {
      it('should thrown an error', function(done) {
        integrate({ codesPostauxFilePath: '_' }).loadCodePostaux()
          .then(function(data) {
            expect(data).to.be.undefined;
            done();
          }, function(error) {
            expect(error.code).to.equal('ENOENT');
            done();
          });
      });
    });

    describe('good file path', function() {
      it('should load 1 correspondances', function(done) {
        const options = { communesFilePath: __dirname + '/integration-data/communes.json',
                          codesPostauxFilePath: __dirname + '/integration-data/cp.json'};
        const integration = integrate(options);
        integration.loadCommunes();
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(1);
            done();
          }, function(error) {
            done(error);
          });
      });
    });

    describe('unknown codeInsee', function() {
      it('should load 0 correspondances', function(done) {
        const options = {codesPostauxFilePath: __dirname + '/integration-data/unknown-cp.json'};
        const integration = integrate(options);
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(0);
            done();
          }, function(error) {
            done(error);
          });
      });
    });

    describe('MARSEILLE vs MARSEILLETTE', function() {
      it('should not override MARSEILLETTE with MARSEILLE codeInsee', function(done) {
        const options = { communesFilePath: __dirname + '/integration-data/communes.json',
                          codesPostauxFilePath: __dirname + '/integration-data/cp.json'};
        const integration = integrate(options);
        integration.loadCommunes();
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(1);
            expect(integration.communes.has(11220)).to.true;
            done();
          }, function(error) {
            done(error);
          });
      });
    });

    describe('Exclusion', function() {
      it('should exclude Polynesia.', function(done) {
        const options = {codesPostauxFilePath: __dirname + '/integration-data/polynesie-cp.json'};
        const integration = integrate(options);
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(0);
            done();
          }).catch(function(error) {
            done(error);
          });
      });
      it('should exclude Monaco.', function(done) {
        const options = {codesPostauxFilePath: __dirname + '/integration-data/monaco-cp.json'};
        const integration = integrate(options);
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(0);
            done();
          }).catch(function(error) {
            done(error);
          });
      });
    });
  });

  describe('serialize()', function() {
    describe('no communes', function() {
      const options = {outputFilePath: __dirname + '/integration-data/serialize-test.json'};
      const integration = integrate(options);
      it('should return an error', function(done) {
        integration.serialize()
        .then(function(data) {
          done(data);
        }).catch(function(error) {
          expect(error).to.equal('No communes');
          done();
        });
      });
      it('should not create file', function(done) {
        fs.stat(options.outputFilePath, function(err) {
          expect(err.code).to.equal('ENOENT');
          done();
        });
      });
    });

    describe('normal way', function() {
      const options = { outputFilePath: __dirname + '/integration-data/serialize-test.json',
                        communesFilePath: __dirname + '/integration-data/communes.json'};
      const integration = integrate(options);
      it('should return 1 and create file', function(done) {
        integration.loadCommunes()
          .then(integration.serialize)
          .then(function(data) {
            expect(data).to.equal(1);
            fs.stat(options.outputFilePath, function(err) {
              expect(err).to.be.undefined;
            });
            const result = require(options.outputFilePath);
            expect(result[0].codeInsee).to.equal('11220');
            expect(result[0].codesPostaux).to.empty;
            expect(result[0].nom).to.equal('Marseillette');
            expect(result[0].contour).to.exist;
            expect(result[0].centre).to.exist;
            expect(result[0].surface).to.equal(801);
            fs.unlink(options.outputFilePath);
            done();
          }).catch(function(error) {
            done(error);
          });
      });
    });
  });
});
