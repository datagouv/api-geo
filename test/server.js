/* eslint-env mocha */
const request = require('supertest');
const fs = require('fs');
const server = require('../server');
const expect = require('expect.js');

describe('Test api', function() {
  describe('get definition', function() {
    it('should return definition.yml', done => {
      request(server)
          .get('/definition.yml')
          .expect(res => {
            const definition = res.text;
            const definitionFile = fs.readFileSync('definition.yml');
            expect(definition).to.equal(definitionFile.toString());
          })
          .expect(200, done);
    });
  });

  describe('with unknown route', function() {
    it('should reply with 404', done => {
      request(server)
          .get('/no-where')
          .expect(404, done);
    });
  });

  describe('with no input', function() {
    it('should reply with 400', done => {
      request(server)
          .get('/communes')
          .expect(400, done);
    });
  });

  describe('with code insee', function() {
    it('should work for insee 94067', function(){
      request(server)
          .get('/communes/?codeInsee=94067')
          .expect(200);
    });


    describe('with name', function() {
      it('should work for Paris', done => {
        request(server)
            .get('/communes/?nom=paris')
            .expect(200, done);
      });
    });

    describe('with code postal', function() {
      it('should work for cp 28100', done => {
        request(server)
            .get('/communes/?codePostal=28100')
            .expect(res => {
              expect(res.body.length).to.equal(1);
              const commune = res.body[0];
              expect(commune.nom).to.equal('Dreux');
            })
            .end(done);
      });
    });

    it('should reply a commune containing a valid Feature', done => {
      request(server)
        .get('/communes/?codeInsee=55001')
        .expect(res => {
          expect(res.body.length).to.equal(1);
          const commune = res.body[0];
          expect(commune.nom).to.equal('Abainville');
          expect(commune.codeInsee).to.equal('55001');
          expect(commune.codesPostaux).to.eql(['55130']);
          expect(commune.surface).to.equal(1367);
          expect(commune.centre).to.exist;
        })
        .end(done);
    });
  });

  describe('with format', function() {
    it('should return geojson data', done =>{
      request(server)
          .get('/communes/?codeInsee=94067&format=geojson')
          .expect(res => {
            const commune = res.body;
            expect(commune.FeatureCollection).to.exist;
          })
          .end(done);
    });
  });
});
