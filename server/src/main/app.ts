import * as express from 'express'
import * as helmet from 'helmet'
import * as httpProxy from 'http-proxy'
import * as path from 'path'
import { settings } from './settings'

const staticsPath = path.join(__dirname, '..', '..', 'front', 'build')

async function main() {
  const app = express()
  app.use(helmet())
  app.use(express.static(staticsPath))

  const { address, user, pass } = settings.semuxApi
  const proxy = httpProxy.createProxy({
    target: address,
    auth: `${user}:${pass}`,
    proxyTimeout: 5000,
  })
  const proxyMiddleware = (req, res, next) => {
    proxy.web(req, res, undefined, next)
  }
  app.get('/v2.1.0/info', proxyMiddleware)
  app.get('/v2.1.0/account', proxyMiddleware)
  app.get('/v2.1.0/account/transactions', proxyMiddleware)
  app.get('/v2.1.0/account/pending-transactions', proxyMiddleware)
  app.get('/v2.1.0/account/votes', proxyMiddleware)
  app.get('/v2.1.0/delegates', proxyMiddleware)
  app.get('/v2.1.0/latest-block', proxyMiddleware)
  app.post('/v2.1.0/transaction/raw', proxyMiddleware)

  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      message: `proxy server error: ${err.message}`,
    })
  })

  const addr = await new Promise((resolve) => {
    const { port, hostname } = settings.semuxLight
    const server = app.listen(port, hostname, () => resolve(server.address()))
  })
  console.log('server listening:', addr)
}

main()
