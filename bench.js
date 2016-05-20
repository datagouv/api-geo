const Benchmark = require('benchmark');
const communesDb = require('./lib/communeStore');
const debug = require('debug')('bench');



function bench(index) {
  const suite = new Benchmark.Suite;
  suite
    .add('spatial search (point)', function() {
      index.query([6.175882816314696, 49.11830706404367]);
    })
    .add('text search', function() {
      index.queryByName('metz');
    })
    .add('CP search', function() {
      index.queryByCP('54490');
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
}

communesDb()
  .then(bench);
