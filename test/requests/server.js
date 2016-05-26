/* eslint-env mocha */
/* global run */
const request = require('supertest');
const serverReady = require('../../server');
const expect = require('expect.js');

serverReady.then(function (server) {
  describe('Server module test', function() {
    describe('with no data', function() {
      it('should reply with 400', function(done) {
        request(server)
          .get('/communes')
          .expect(400, done);
      });
    });

    describe('with invalid Insee code', function() {
      it('should reply with 404', function(done) {
        request(server)
          .get('/communes/42')
          .expect(404, done);
      });
    });

    describe('with valid Insee code', function() {
      it('should work for insee 75056', done => {
        request(server)
            .get('/communes/75056')
            .expect(200)
            .end(done);
      });
      it('should reply a FeatureCollection containing a valid Feature', done => {
        request(server)
            .get('/communes/17283')
            .expect(res => {
              const feature = res.body;
              expect(feature.type).to.equal('Feature');
              expect(feature.properties).to.eql({
                nom: 'Pons',
                code_insee: '17283',
                surface: '2781'
              });
            })
            .end(done);
      });
    });
  });
  run();
});
