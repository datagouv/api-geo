const fs = require('fs')
const {createGunzip} = require('zlib')
const centroid = require('@turf/centroid')
const union = require('@turf/union')
const {feature} = require('@turf/helpers')
const JSONStream = require('JSONStream')
const parse = require('csv-parse')
const t = require('through2').obj
const iconv = require('iconv-lite')
const streamify = require('stream-array')
const {omit} = require('lodash')

const communesMortesPourLaFrance = ['55189', '55039', '55050', '55239', '55307', '55139']

function isIgnoredCommune(code) {
  return [
    '98', // Polynésie
    '99', // Monaco
    '975', // Saint-Pierre-et-Miquelon
    '977' // Saint-Barthelemy
  ].some(prefix => code.indexOf(prefix) === 0)
}

/* Initialisation */
function init(ctx, next) {
  ctx.communes = new Map()

  ctx.createCommune = code => {
    if (ctx.communes.has(code)) throw new Error('La commune est déjà dans le référentiel')
    const commune = {code, codesPostaux: new Set(), communesMembres: new Set()}
    ctx.communes.set(code, commune)
    return commune
  }

  ctx.getCommune = code => {
    if (!ctx.communes.has(code)) {
      throw new Error(`La commune ${code} n'est pas présente dans le référentiel`)
    }
    return ctx.communes.get(code)
  }

  ctx.getOrCreateCommune = code => {
    if (!ctx.hasCommune(code)) ctx.createCommune(code)
    return ctx.getCommune(code)
  }

  ctx.getCommuneActuelle = code => {
    const commune = ctx.getCommune(code)
    if (commune.ancienne && !commune.communeRattachement)
      throw new Error('Ancienne commune sans commune de rattachement')
    return commune.communeRattachement ? commune.communeRattachement : commune
  }

  ctx.hasCommune = code => {
    return ctx.communes.has(code)
  }

  next()
}

/* Chargement des communes */
function loadCommunes(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données France2018 ')
    let count = 0

    fs.createReadStream(options.srcPath || __dirname + '/../../data/France2018.txt')
      .pipe(iconv.decodeStream('win1252'))
      .on('error', next)
      .pipe(parse({delimiter: '\t', columns: true}))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        if (!['1', '2', '3', '6'].includes(data.ACTUAL)) return cb()
        if (data.ACTUAL === '3' && !data.POLE) return cb()
        const code = data.DEP + data.COM
        if (isIgnoredCommune(code)) return cb()
        const commune = ctx.getOrCreateCommune(code)
        if (data.ACTUAL === '1') {
          commune.codeRegion = data.REG
          commune.codeDepartement = data.DEP === '97' ? data.DEP + data.COM.charAt(0) : data.DEP
        } else {
          commune.ancienne = true
          const communeRattachement = ctx.getOrCreateCommune(data.POLE)
          commune.communeRattachement = communeRattachement
          communeRattachement.communesMembres.add(commune)
        }
        if (communesMortesPourLaFrance.includes(code)) {
          commune.mortePourLaFrance = true
        }
        if (data.ARTMIN) {
          const art = data.ARTMIN.replace(/(\(|\))/g, '')
          commune.nom = art + (art.endsWith('\'') ? '' : ' ') + data.NCCENR
        } else {
          commune.nom = data.NCCENR
        }
        count++
        cb()
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de communes chargées : %d', count)
        next()
      })
  }
}

function moreCommunes() {
  return function (ctx, next) {
    // https://www.insee.fr/fr/information/2028040#st-martin
    const saintMartin = ctx.getOrCreateCommune('97801')
    saintMartin.nom = 'Saint-Martin'
    // https://www.insee.fr/fr/statistiques/2119468?sommaire=2119504#titre-bloc-5
    saintMartin.population = 35594
    // OSM
    saintMartin.centre = {type: 'Point', coordinates: [-63.08582, 18.06685]}
    next()
  }
}

/* Chargement des contours */
function loadGeometries(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données communes-dp25 (géométries + noms)')
    let count = 0

    fs.createReadStream(options.srcPath || __dirname + '/../../data/communes-dp25-20180101.geojson.gz')
      .on('error', next)
      .pipe(createGunzip())
      .on('error', next)
      .pipe(JSONStream.parse('features.*'))
      .on('error', next)
      .pipe(t((communeFeature, enc, cb) => {
        const code = communeFeature.properties.insee
        if (isIgnoredCommune(code)) return cb()
        if (!ctx.hasCommune(code)) {
          ctx.debug(`géométries : commune ${communeFeature.properties.nom} (${code}) introuvable => ignorée`)
          return cb()
        }
        const commune = ctx.getCommune(code)
        commune.contour = communeFeature.geometry
        commune.surface = communeFeature.properties.surf_ha
        commune.centre = centroid(feature(commune.contour)).geometry
        count++
        cb()
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de géométries chargées : %d', count)
        next()
      })
  }
}

/* Chargement des codes postaux */
function loadCodePostaux(options = {}) {
  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données hexasmal (codes postaux)')
    let count = 0

    fs.createReadStream(options.srcPath || __dirname + '/../../data/laposte_hexasmal_2017.json')
      .on('error', next)
      .pipe(JSONStream.parse('*'))
      .on('error', next)
      .pipe(t((correspondance, enc, cb) => {
        let code = correspondance.fields.code_commune_insee
        const codePostal = correspondance.fields.code_postal
        const nom = correspondance.fields.nom_de_la_commune
        if (isIgnoredCommune(code)) return cb()

        if (!ctx.hasCommune(code)) {
          if (nom.toUpperCase().indexOf('PARIS ') === 0) {
            code = '75056'
          } else if (nom.toUpperCase().indexOf('MARSEILLE ') === 0) {
            code = '13055'
          } else if (nom.toUpperCase().indexOf('LYON ') === 0) {
            code = '69123'
          } else {
            ctx.debug('Code INSEE non trouvé: %s (%s)', code, nom)
            return cb()
          }
        }

        ctx.getCommuneActuelle(code).codesPostaux.add(codePostal)
        count++

        cb()
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de correspondances chargées : %d', count)
        next()
      })
  }
}

/* Population */
function loadPopulation(options = {}) {
  if (!options.srcPath) throw new Error('srcPath is required')

  return function (ctx, next) {
    ctx.debug('Chargement du jeu de données ' + options.srcPath)
    let count = 0

    fs.createReadStream(options.srcPath)
      .on('error', next)
      .pipe(parse({delimiter: ';', columns: true}))
      .on('error', next)
      .pipe(t((data, enc, cb) => {
        const code = data.DEPCOM
        if (!code || !data.PMUN13) return cb()
        const population = Number.parseInt(data.PMUN13, 10)
        if (!population) return cb()
        if (isIgnoredCommune(code)) return cb()
        if (!ctx.hasCommune(code)) {
          ctx.debug('population: commune non trouvée => %s (%s)', code, data.LIBMIN)
          return cb()
        }
        ctx.getCommune(code).population = population
        count++
        cb()
      }))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de populations chargées : %d', count)
        next()
      })
  }
}

/* Agrégation */
function aggregate() {
  return (ctx, next) => {
    ctx.debug('Agrégation des communes nouvelles')
    ctx.communes.forEach(commune => {
      if (!commune.ancienne && commune.communesMembres.size > 0) {
        /* Contours */
        const communeContours = []
        commune.communesMembres.forEach(communeMembre => {
          if (communeMembre.contour) communeContours.push(communeMembre)
        })
        if (communeContours.length > 0) {
          if (commune.contour) communeContours.push(commune)
          ctx.debug('Commune nouvelle de %s (%s) : agrégation des contours', commune.nom.toUpperCase(), commune.code)
          let unionContour
          let surfaceTotale = 0
          communeContours.forEach(c => {
            ctx.debug('  contour de %s (%s)', c.nom.toUpperCase(), c.code)
            if (unionContour) {
              unionContour = union(feature(unionContour), feature(c.contour)).geometry
            } else {
              unionContour = c.contour
            }
            surfaceTotale += c.surface
          })
          commune.contour = unionContour
          commune.surface = surfaceTotale
          commune.centre = centroid(feature(commune.contour)).geometry
        }

        /* Population */
        const communePopulations = []
        commune.communesMembres.forEach(communeMembre => {
          if (communeMembre.population) communePopulations.push(communeMembre)
        })
        if (communePopulations.length > 0) {
          if (commune.population) communePopulations.push(commune)
          ctx.debug('Commune nouvelle de %s (%s) : agrégation de la population', commune.nom.toUpperCase(), commune.code)
          let populationTotale = 0
          communePopulations.forEach(c => {
            ctx.debug('  population de %s (%s) : %d', c.nom.toUpperCase(), c.code, c.population)
            populationTotale += c.population
          })
          commune.population = populationTotale
        }
      }
    })
    next()
  }
}

/* Sérialisation */
function serialize(options = {}) {
  return function (ctx, next) {
    ctx.debug('Sérialisation des données')
    let count = 0

    if (ctx.communes.size < 1) {
      return next(new Error('No commune'))
    }
    streamify([...ctx.communes.values()])
      .on('error', next)
      .pipe(t((commune, enc, cb) => {
        if (commune.ancienne) return cb()
        commune.codesPostaux = [...commune.codesPostaux].sort()
        count++
        cb(null, omit(commune, 'communesMembres', 'communeRattachement', 'ancienne'))
      }))
      .on('error', next)
      .pipe(JSONStream.stringify())
      .on('error', next)
      .pipe(fs.createWriteStream(options.destPath || __dirname + '/../../data/communes.json'))
      .on('error', next)
      .on('finish', () => {
        ctx.debug('Nombre de communes écrites : %d', count)
        next()
      })
  }
}

/* Vérification de l'intégrité des communes chargées */
function checkCommunes() {
  return function (ctx, next) {
    ctx.debug('Validation des communes')
    let count = 0

    for (const commune of ctx.communes.values()) {
      if (!commune.ancienne) {
        let valid = true
        if (!commune.contour) {
          valid = true
          ctx.debug(`${commune.nom} (${commune.code}) n'a pas de contours!`)
        }
        if (!commune.codesPostaux.size) {
          valid = false
          ctx.debug(`${commune.nom} (${commune.code}) n'a pas de codes postaux!`)
        }
        if (!commune.codeDepartement) {
          valid = true
          ctx.debug(`${commune.nom} (${commune.code}) n'a pas de code de département!`)
        }
        if (!commune.population && !commune.mortePourLaFrance) {
          ctx.debug(`${commune.nom} (${commune.code}) n'a pas de population!`)
        }
        if (!valid) {
          count++
          ctx.communes.delete(commune.code)
        }
      }
    }
    ctx.debug('Nombre de communes délictueuses : %d', count)
    next()
  }
}

/* Exports */
module.exports = {isIgnoredCommune, init, loadCommunes, moreCommunes, loadGeometries, loadCodePostaux, loadPopulation, serialize, aggregate, checkCommunes}
