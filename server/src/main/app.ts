import * as express from 'express'
import * as path from 'path'
import * as httpProxy from 'http-proxy'
import * as request from 'superagent'
import { brief } from './brief-route'

const staticsPath = path.join(__dirname, '..', '..', 'front', 'dist')

async function main() {
  const app = express()
  app.use(express.static(staticsPath))

  {
    const proxy = httpProxy.createProxy({
      target: 'http://localhost:5171',
      auth: 'user:123456',
    })
    const proxyMiddleware = (req, res, next) => {
      proxy.web(req, res, undefined, console.error)
    }
    app.get('/v2.0.0/account/transactions', proxyMiddleware)
    app.post('/v2.0.0/transaction/raw', proxyMiddleware)
  }

  {
    app.get('/brief', brief)
  }

  const addr = await new Promise((resolve) => {
    const server = app.listen(3333, () => resolve(server.address()))
  })
  console.log('server listening:', addr)
}

main()
