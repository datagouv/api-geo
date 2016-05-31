/* eslint-env mocha */
const integrate = require('../lib/integrate').integration;
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
});
