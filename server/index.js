// See the following URL for server API docs
// https://github.com/websockets/ws/blob/master/doc/ws.md
const WebSocket = require('ws')

function createServer (opts, cb = () => {}) {
  opts = Object.assign({ port: 8080, clientTracking: true }, opts)

  function randomName () {
    return 'client-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  }

  function noop () {}

  function heartbeat () {
    this.isAlive = true
  }

  const interval = setInterval(function ping () {
    wss.clients.forEach(function each (ws) {
      if (ws.isAlive === false) return ws.terminate()

      ws.isAlive = false
      ws.ping(noop)
    })
  }, 30000)

  const wss = new WebSocket.Server(opts, cb)

  wss.on('connection', (ws, req) => {
    ws.name = randomName()
    ws.isAlive = true
    ws.on('pong', heartbeat)
    ws.on('message', function incoming (message) {
      let data
      try {
        data = JSON.parse(message)
      } catch (e) {
        console.log('Error parsing message:')
        console.log(e)
        console.log(message)
      }

      try {
        handleMessage(ws, data)
      } catch (e) {
        console.log('Error handling message:')
        console.log(e)
        console.log(message)
      }
    })
  })

  wss.broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  function handleMessage (ws, data) {
    switch (data.action) {
      case 'echo': {
        ws.send(JSON.stringify({
          type: 'echo',
          echo: data.echo
        }))
        break
      }
      case 'message': {
        wss.broadcast(JSON.stringify({
          type: 'message',
          msg: data.msg,
          sender: ws.name
        }))
        break
      }
      case 'name': {
        ws.name = data.name
        ws.send(JSON.stringify({
          type: 'name',
          name: ws.name
        }))
        break
      }
      default: {
        console.log('unknown action: ' + data.action)
        console.log(data)
        break
      }
    }
  }

  wss.on('close', () => {
    console.log('server closed')
    clearInterval(interval)
  })

  wss.on('error', console.log)
  // wss.on('headers', (headers, request) => console.log(headers))
  wss.on('listening', () => console.log('Server is listening'))

  return wss
}

module.exports = createServer
