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

  /* Communes */
  describe('Communes', function() {
    describe('with no input', function() {
      it('should reply with 400', done => {
        request(server)
            .get('/communes')
            .expect(400, done);
      });
    });

    describe('with code insee', function() {
      it('should work for insee 94067', function() {
        request(server)
            .get('/communes/?code=94067')
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

      it('should reply a commune', done => {
        request(server)
          .get('/communes/?code=55001')
          .expect(res => {
            expect(res.body.length).to.equal(1);
            const commune = res.body[0];
            expect(commune.nom).to.equal('Abainville');
            expect(commune.code).to.equal('55001');
            expect(commune.codesPostaux).to.eql(['55130']);
            expect(commune.surface).to.equal(1367);
            expect(commune.centre).to.exist;
          })
          .end(done);
      });
    });

    describe('with format', function() {
      it('should return geojson data', done => {
        request(server)
            .get('/communes/?code=94067&format=geojson')
            .expect(res => {
              const commune = res.body;
              expect(commune.FeatureCollection).to.exist;
            })
            .end(done);
      });
    });
  });

  /* Départements */
  describe('Departements', function() {
    describe('with no input', function() {
      it('should reply with 200', done => {
        request(server)
            .get('/departements')
            .expect(200, done);
      });
      it('should reply all 101 departements', done => {
        request(server)
            .get('/departements')
            .expect(res => {
              expect(res.body.length).to.equal(101);
            })
            .end(done);
      });
    });

    describe('with code', function() {
      it('should work for 75', function() {
        request(server)
            .get('/departements/?code=75')
            .expect(200);
      });


      describe('with name', function() {
        it('should work for Paris', done => {
          request(server)
              .get('/departements/?nom=paris')
              .expect(200, done);
        });
      });

      describe('with code region', function() {
        it('should work for 11', done => {
          request(server)
              .get('/departements/?codeRegion=11')
              .expect(res => {
                expect(res.body.length).to.equal(8);
                const departement = res.body[0];
                expect(departement.nom).to.equal('Paris');
              })
              .end(done);
        });
        it('should reply a departement', done => {
          request(server)
            .get('/departements/?code=27')
            .expect(res => {
              expect(res.body.length).to.equal(1);
              const departement = res.body[0];
              expect(departement).to.eql({ nom: 'Eure', code: '27', codeRegion: '28' });
            })
            .end(done);
        });
      });
    });
  });

  /* Régions */
  describe('Regions', function() {
    describe('with no input', function() {
      it('should reply with 200', done => {
        request(server)
            .get('/regions')
            .expect(200, done);
      });
      it('should reply all 18 regions', done => {
        request(server)
            .get('/regions')
            .expect(res => {
              expect(res.body.length).to.equal(18);
            })
            .end(done);
      });
    });

    describe('with code', function() {
      it('should work for 28', function() {
        request(server)
            .get('/regions/?code=28')
            .expect(200);
      });
      it('should reply a departement', done => {
        request(server)
          .get('/regions/?code=28')
          .expect(res => {
            expect(res.body.length).to.equal(1);
            const departement = res.body[0];
            expect(departement).to.eql({ nom: 'Normandie', code: '28' });
          })
          .end(done);
      });
    });

    describe('with name', function() {
      it('should work for Normandie', done => {
        request(server)
            .get('/regions/?nom=normandie')
            .expect(200, done);
      });
    });
  });
});
