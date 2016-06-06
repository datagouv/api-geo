/* eslint no-console: ["off"] */
require('./lib/integration')(function (err) {
  process.exit(err ? 1 : 0);
});
