/* eslint no-console: ["off"] */
require('./lib/integration').integrate(function (err) {
  process.exit(err ? 1 : 0);
});
