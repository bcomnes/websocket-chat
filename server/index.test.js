const test = require('tape')
const createServer = require('./index.js')
const URWS = require('universal-reconnecting-websocket')

test('server is imported and is turned on', t => {
  const server = createServer()

  const client = new URWS('ws://localhost:8080')

  const timeout = setTimeout((t) => {
    client.stop()
    server.close(() => {
      t.fail('test timed out')
      t.end()
    })
  }, 10000, t)

  client.on('connect', () => {
    client.send({
      action: 'echo',
      echo: 'hello world'
    })
  })

  client.on('message', (msg) => {
    t.equal(msg.type, 'echo', 'receive echo event after pinging')
    t.equal(msg.echo, 'hello world', 'received echo payload')
    client.stop()
    server.close(() => {
      clearTimeout(timeout)
      t.end()
    })
  })

  client.start()
})

test('able to send a message', t => {
  const server = createServer()

  const client1 = new URWS('ws://localhost:8080')
  const client2 = new URWS('ws://localhost:8080')

  const timeout = setTimeout((t) => {
    client1.stop()
    client2.stop()
    server.close(() => {
      t.fail('test timed out')
      t.end()
    })
  }, 10000, t)

  client1.on('connect', () => {
    client1.send({
      action: 'name',
      name: 'client1'
    })

    client1.send({
      action: 'message',
      msg: 'a message from client1'
    })
  })

  client1.on('message', (msg) => {
    switch (msg.type) {
      case 'name': {
        t.equal(msg.type, 'name', 'client1 set its name')
        t.equal(msg.name, 'client1', 'client1 received name field')
        break
      }
      case 'message': {
        t.equal(msg.type, 'message', 'client1 receive message event after sending')
        t.equal(msg.msg, 'a message from client1', 'received message')
        t.equal(msg.sender, 'client1', 'received message sender')
        client1.stop()
        break
      }
      default: {
        t.fail('unknown message')
        client1.stop()
        client2.stop()
        server.close(() => {
          t.fail('test timed out')
          t.end()
        })
      }
    }
  })

  client2.on('message', (msg) => {
    t.equal(msg.type, 'message', 'receive message event after sending')
    t.equal(msg.msg, 'a message from client1', 'received message')
    t.equal(msg.sender, 'client1', 'received message sender')
    client2.stop()
    server.close(() => {
      clearTimeout(timeout)
      t.end()
    })
  })

  client2.start()
  client1.start()
})
