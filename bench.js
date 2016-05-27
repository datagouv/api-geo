const Benchmark = require('benchmark');
const db = require('./lib/db');
const debug = require('debug')('bench');


const suite = new Benchmark.Suite;

suite
  .add('spatial search (point)', function() {
    db.query([6.175882816314696, 49.11830706404367]);
  })
  .add('text search', function() {
    db.queryByName('metz');
  })
  .add('CP search', function() {
    db.queryByCP('54490');
  })
  .on('cycle', function(event) {
    debug(String(event.target));
  })
  .on('complete', function() {
    debug('Fastest is %s', this.filter('fastest').map('name'));
    debug('Memory usage: %s', JSON.stringify(process.memoryUsage()));
  })
  // run async
  .run({ 'async': true });
