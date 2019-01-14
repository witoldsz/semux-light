import * as express from 'express'
import { Request, Response, NextFunction } from 'express'
import * as helmet from 'helmet'
import * as httpProxy from 'http-proxy'
import * as path from 'path'
import { settings } from './settings'
import * as request from 'request-promise-native'
import * as url from 'url'
import * as fs from 'fs'
import * as R from 'ramda'

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

  interface ProxyDef {
    [method: string]: Array<'get' | 'post' | 'options'>
  }

  const proxyDef: ProxyDef = {
    '/v2.1.0/info': ['get'],
    '/v2.1.0/account': ['get'],
    '/v2.1.0/account/transactions': ['get'],
    '/v2.1.0/account/pending-transactions': ['get'],
    '/v2.1.0/account/votes': ['get'],
    '/v2.1.0/delegates': ['get'],
    '/v2.1.0/latest-block': ['get'],
    '/v2.1.0/transaction/raw': ['post', 'options'],
    '/v2.1.0/swagger.html': ['get'],
    '/swagger-ui/*': ['get'],
  }

  const proxyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      corsHeader(res).end()
    } else {
      proxy.web(req, corsHeader(res), undefined, next)
    }
  }

  Object.entries(proxyDef).forEach(([path, methods]) => {
    methods.forEach((method) => {
      app[method](path, proxyMiddleware)
    })
  })

  app.get('/v2.1.0/swagger.json', (req, res, next) => {
    const auth = { user, pass }
    request.get(url.resolve(address, 'v2.1.0/swagger.json'), { auth, json: true })
      .then((orig) => {
        const paths = R.pipe(
          R.mapObjIndexed<any, any>((i, path) => {
            const methods = proxyDef[`/v2.1.0${path}`]
            return methods && R.pick(methods, i)
          }),
          R.filter(R.identity),
          R.map(R.map(R.dissoc('security'))),
        )(orig.paths)

        res.json(R.pipe(
          R.assocPath(['info', 'title'], 'Semux Online API'),
          R.assoc('paths', paths),
          R.dissoc('security'),
          R.dissoc('securityDefinitions'),
          R.dissoc('schemes'),
        )(orig))
      })
      .catch(next)
  })

  // coinmarketcap requirements
  app.get('/total-sem', (req, res) => {
    const infoUrl = url.resolve(address, 'v2.1.0/info')
    const delegatesUrl = url.resolve(address, 'v2.1.0/delegates')
    const get = (u) => request.get(u, { auth: { user, pass }, json: true })

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
    console.log(err)
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
