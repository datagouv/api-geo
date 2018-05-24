#!/usr/bin/env node
/* eslint no-console: ["off"] */
require('./lib/integration').integrate(err => {
  if (err) console.error(err)
  process.exit(err ? 1 : 0)
})
