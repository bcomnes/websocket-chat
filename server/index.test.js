const test = require('tape')
const ChatServer = require('./index.js')
const URWS = require('universal-reconnecting-websocket')

test('server is imported and is turned on', t => {
  const server = new ChatServer()
  server.start()

  const client = new URWS('ws://localhost:8080')
  client.start()

  server.on('connect')
})
