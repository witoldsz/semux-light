import * as express from 'express'
import * as path from 'path'
import * as httpProxy from 'http-proxy'
import * as request from 'superagent'

const staticsPath = path.join(__dirname, '..', '..', 'front', 'dist')

async function main() {
  const app = express()
  app.use(express.static(staticsPath))

  const proxy = httpProxy.createProxy({
    target: 'http://localhost:5171',
    auth: 'user:123456',
  })
  const proxyMiddleware = (req, res, next) => {
    proxy.web(req, res, undefined, console.error)
  }
  app.get('/v2.0.0/info', proxyMiddleware)
  app.get('/v2.0.0/account', proxyMiddleware)
  app.get('/v2.0.0/account/transactions', proxyMiddleware)
  app.get('/v2.0.0/account/votes', proxyMiddleware)
  app.get('/v2.0.0/delegates', proxyMiddleware)
  app.get('/v2.0.0/latest-block', proxyMiddleware)
  app.post('/v2.0.0/transaction/raw', proxyMiddleware)

  const addr = await new Promise((resolve) => {
    const server = app.listen(3333, () => resolve(server.address()))
  })
  console.log('server listening:', addr)
}

main()
