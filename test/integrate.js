/* eslint-env mocha */
const integrate = require('../lib/integrate').integration;
const fs = require('fs');
const expect = require('expect.js');


describe('integration', function() {

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
    describe('undefined file path', function() {
      it('should thrown an error', function(done) {
        const integration = integrate();
        integration.loadCommunes()
          .then(function(data) {
            expect(data).to.be.undefined;
            done();
          }, function(error) {
            expect(error.message).to.equal('path must be a string or Buffer');
            done();
          });
      });
    });

    describe('good file path', function() {
      it('should return the number of loaded communes.', function(done) {
        const integration = integrate(__dirname + '/integration-data/communes.json', null, null);
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
    describe('undefined file path', function() {
      it('should thrown an error', function(done) {
        const integration = integrate();
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.be.undefined;
            done();
          }, function(error) {
            expect(error.message).to.equal('path must be a string or Buffer');
            done();
          });
      });
    });

    describe('good file path', function() {
      it('should load 3 correspondances', function(done) {
        const integration = integrate(null, __dirname + '/integration-data/cp.json', null);
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(1);
            done();
          }, function(error) {
            expect(error).to.be.undefined;
            done();
          });
      });
    });

    describe('Exclusion', function() {
      it('should exclude Polynesia.', function(done) {
        const integration = integrate(null, __dirname + '/integration-data/polynesie-cp.json', null);
        integration.loadCodePostaux()
          .then(function(data) {
            expect(data).to.equal(0);
            done();
          }).catch(function(error) {
            done(error);
          });
      });
      it('should exclude Monaco.', function(done) {
        const integration = integrate(null, __dirname + '/integration-data/monaco-cp.json', null);
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
      const path = __dirname + '/integration-data/serialize-test.json';
      const integration = integrate(null, null, path);
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
        fs.stat(path, function(err) {
          expect(err.code).to.equal('ENOENT');
          done();
        });
      });
    });

    describe('normal way', function() {
      const communesPath = __dirname + '/integration-data/communes.json';
      const destinationPath = __dirname + '/integration-data/serialize-test.json';
      const integration = integrate(communesPath, null, destinationPath);
      it('should return 1 and create file', function(done) {
        integration.loadCommunes()
          .then(integration.serialize)
          .then(function(data) {
            expect(data).to.equal(1);
            fs.stat(destinationPath, function(err) {
              expect(err).to.be.undefined;
            });
            const result = require(destinationPath);
            expect(result[0].codeInsee).to.equal('66213');
            expect(result[0].codesPostaux).to.empty;
            expect(result[0].nom).to.equal('Toulouges');
            expect(result[0].contour).to.exist;
            expect(result[0].centre).to.exist;
            expect(result[0].surface).to.equal(801);
            fs.unlink(destinationPath);
            done();
          }).catch(function(error) {
            done(error);
          });
      });
    });
  });
});
