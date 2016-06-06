const debug = require('debug')('integration');
const async = require('async');
const once = require('once');

module.exports = function runPipeline(pipeline, done) {
  // Initialize context
  const ctx = { debug };

  async.series(pipeline.map(step => {
    // Inject context and ensure callback is called once
    return next => step(ctx, once(next));
  }), done);
};
