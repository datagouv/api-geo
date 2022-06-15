/* eslint-env mocha */
const fs = require('fs')
const request = require('supertest')
const expect = require('expect.js')
const server = require('../server')

describe('Test api', () => {
  describe('get definition', () => {
    it('should return definition.yml', done => {
      request(server)
        .get('/definition.yml')
        .expect(res => {
          const definition = res.text
          const definitionFile = fs.readFileSync('definition.yml')
          expect(definition).to.equal(definitionFile.toString())
        })
        .expect(200, done)
    })
  })

  describe('with unknown route', () => {
    it('should reply with 404', done => {
      request(server)
        .get('/no-where')
        .expect(404, done)
    })
  })

  /* Communes */
  describe('Communes', () => {
    describe('with no query (json)', () => {
      it('should reply with 200', done => {
        request(server)
          .get('/communes')
          .expect(200, done)
      })
    })

    describe('with no query (geojson)', () => {
      it('should reply with 400', done => {
        request(server)
          .get('/communes?format=geojson')
          .expect(400, done)
      })
    })

    describe('with no query (json, asking contour)', () => {
      it('should reply with 400', done => {
        request(server)
          .get('/communes?fields=contour')
          .expect(400, done)
      })
    })

    describe('with code insee', () => {
      it('should work for insee 94067', () => {
        request(server)
          .get('/communes/?code=94067')
          .expect(200)
      })

      describe('with name', () => {
        it('should work for Paris', done => {
          request(server)
            .get('/communes/?nom=paris')
            .expect(200, done)
        })
      })

      describe('with code postal', () => {
        it('should work for cp 28100', done => {
          request(server)
            .get('/communes/?codePostal=28100')
            .expect(res => {
              expect(res.body.length).to.equal(1)
              const commune = res.body[0]
              expect(commune.nom).to.equal('Dreux')
            })
            .end(done)
        })
      })

      it('should reply a commune', done => {
        request(server)
          .get('/communes/?code=55001')
          .expect(res => {
            expect(res.body.length).to.equal(1)
            const commune = res.body[0]
            expect(commune.nom).to.equal('Abainville')
            expect(commune.code).to.equal('55001')
            expect(commune.codesPostaux).to.eql(['55130'])
            expect(commune).to.have.keys(['population', 'codeDepartement', 'codeRegion'])
          })
          .end(done)
      })
    })

    describe('with format', () => {
      it('should return a FeatureCollection (geojson)', done => {
        request(server)
          .get('/communes/?code=94067&format=geojson')
          .expect(res => {
            const communes = res.body
            expect(communes).to.have.key('type')
            expect(communes.type).to.be('FeatureCollection')
          })
          .end(done)
      })
    })

    describe('with all fields', () => {
      it('should return a commune with all fields in it', done => {
        const fields = [
          'code',
          'nom',
          'codesPostaux',
          'population',
          'codeDepartement',
          'codeRegion',
          'departement',
          'region',
          'centre',
          'contour',
          'surface',
          'zone'
        ]
        request(server)
          .get('/communes/54099?fields=' + fields.join(','))
          .expect(res => {
            const commune = res.body
            expect(commune).to.only.have.keys(fields)
          })
          .end(done)
      })
    })
  })

  /* Départements */
  describe('Departements', () => {
    describe('with no input', () => {
      it('should reply with 200', done => {
        request(server)
          .get('/departements')
          .expect(200, done)
      })
      it('should reply all 101 departements', done => {
        request(server)
          .get('/departements')
          .expect(res => {
            expect(res.body.length).to.equal(101)
          })
          .end(done)
      })
    })

    describe('with code', () => {
      it('should work for 75', () => {
        request(server)
          .get('/departements/?code=75')
          .expect(200)
      })

      describe('with name', () => {
        it('should work for Paris', done => {
          request(server)
            .get('/departements/?nom=paris')
            .expect(200, done)
        })
      })

      describe('with code region', () => {
        it('should work for 11', done => {
          request(server)
            .get('/departements/?codeRegion=11')
            .expect(res => {
              expect(res.body.length).to.equal(8)
              const departement = res.body[0]
              expect(departement.nom).to.equal('Paris')
            })
            .end(done)
        })
        it('should reply a departement', done => {
          request(server)
            .get('/departements/?code=27')
            .expect(res => {
              expect(res.body.length).to.equal(1)
              const departement = res.body[0]
              expect(departement).to.eql({nom: 'Eure', code: '27', codeRegion: '28'})
            })
            .end(done)
        })
      })

      describe('list communes', () => {
        it('should reply the list of communes', done => {
          request(server)
            .get('/departements/11/communes')
            .expect(res => {
              expect(res.body.length).to.equal(433)
            })
            .end(done)
        })
        it('should reply with 404', done => {
          request(server)
            .get('/departements/666/communes')
            .expect(404, done)
        })
        it('should return a FeatureCollection (geojson)', done => {
          request(server)
            .get('/departements/75/communes?format=geojson')
            .expect(res => {
              const communes = res.body
              expect(communes).to.have.key('type')
              expect(communes.type).to.be('FeatureCollection')
            })
            .end(done)
        })
      })
    })

    describe('with all fields', () => {
      it('should return a departement with all fields in it', done => {
        const fields = [
          'code',
          'nom',
          'codeRegion',
          'region'
        ]
        request(server)
          .get('/departements/54?fields=' + fields.join(','))
          .expect(res => {
            const commune = res.body
            expect(commune).to.only.have.keys(fields)
          })
          .end(done)
      })
    })
  })

  /* Régions */
  describe('Regions', () => {
    describe('with no input', () => {
      it('should reply with 200', done => {
        request(server)
          .get('/regions')
          .expect(200, done)
      })
      it('should reply all 18 regions', done => {
        request(server)
          .get('/regions')
          .expect(res => {
            expect(res.body.length).to.equal(18)
          })
          .end(done)
      })
    })

    describe('with code', () => {
      it('should work for 28', () => {
        request(server)
          .get('/regions/?code=28')
          .expect(200)
      })
      it('should reply a departement', done => {
        request(server)
          .get('/regions/?code=28')
          .expect(res => {
            expect(res.body.length).to.equal(1)
            const departement = res.body[0]
            expect(departement).to.eql({nom: 'Normandie', code: '28'})
          })
          .end(done)
      })
    })

    describe('with name', () => {
      it('should work for Normandie', done => {
        request(server)
          .get('/regions/?nom=normandie')
          .expect(res => {
            expect(res.body).to.have.length(1)
            expect(res.body[0]).to.have.key('_score')
          })
          .expect(200, done)
      })
    })

    describe('list departements', () => {
      it('should reply the list of departements', done => {
        request(server)
          .get('/regions/84/departements')
          .expect(res => {
            expect(res.body.length).to.equal(12)
          })
          .end(done)
      })
      it('should reply with 404', done => {
        request(server)
          .get('/regions/666/departements')
          .expect(404, done)
      })
    })
  })
})
