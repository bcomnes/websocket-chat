#!/usr/bin/env node

const createServer = require('./index.js')
createServer({
  port: process.env.PORT || 8080
})
