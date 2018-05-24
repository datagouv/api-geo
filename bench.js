const Benchmark = require('benchmark')
const debug = require('debug')('bench')

debug('will load database')
const db = require('./lib/communes').getIndexedDb()

debug('database loaded')

const suite = new Benchmark.Suite()

suite
  .add('spatial search (point)', () => {
    db.search({pointInContour: [6.175882816314696, 49.11830706404367]})
  })
  .add('text search', () => {
    db.search({nom: 'metz'})
  })
  .add('CP search', () => {
    db.search({codePostal: '54490'})
  })
  .on('cycle', event => {
    debug(String(event.target))
  })
  .on('complete', function () {
    debug('Fastest is %s', this.filter('fastest').map('name'))
    debug('Memory usage: %s', JSON.stringify(process.memoryUsage()))
  })
  // Run async
  .run({async: true})
