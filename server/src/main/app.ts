import * as express from 'express'
import { Request, Response, NextFunction } from 'express'
import * as helmet from 'helmet'
import * as httpProxy from 'http-proxy'
import * as path from 'path'
import { settings } from './settings'
import * as request from 'request-promise-native'
import * as url from 'url'

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

  const corsHeader = (res: Response) => res.header('Access-Control-Allow-Origin', '*')

  const proxyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    corsHeader(res)
    proxy.web(req, res, undefined, next)
  }

  app.get('/v2.1.0/info', proxyMiddleware)
  app.get('/v2.1.0/account', proxyMiddleware)
  app.get('/v2.1.0/account/transactions', proxyMiddleware)
  app.get('/v2.1.0/account/pending-transactions', proxyMiddleware)
  app.get('/v2.1.0/account/votes', proxyMiddleware)
  app.get('/v2.1.0/delegates', proxyMiddleware)
  app.get('/v2.1.0/latest-block', proxyMiddleware)
  app.options('/v2.1.0/transaction/raw', (req, res) => {
    corsHeader(res)
    res.end()
  })
  app.post('/v2.1.0/transaction/raw', proxyMiddleware)

  // coinmarketcap requirements
  app.get('/total-sem', (req, res) => {
    const infoUrl = url.resolve(address, 'v2.1.0/info')
    const delegatesUrl = url.resolve(address, 'v2.1.0/delegates')
    const get = (u) => request.get(u, { auth: {user, pass}, json: true })

    Promise
      .all([get(infoUrl), get(delegatesUrl)])
      .then(([info, delegates]) => {
        const { latestBlockNumber } = info.result
        const delegatesCount = delegates.result.length
        const totalSem = settings.semPremine + 3 * parseInt(latestBlockNumber, 10) - 1000 * parseInt(delegatesCount, 10)
        res.send(`${totalSem}`).end()
      })
      .catch((err) => res.sendStatus(500))
  })

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
