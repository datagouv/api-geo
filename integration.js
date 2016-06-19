/* eslint no-console: ["off"] */
require('./lib/integration').integrate(function (err) {
  if (err) console.error(err);
  process.exit(err ? 1 : 0);
});
