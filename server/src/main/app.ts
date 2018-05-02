import * as express from 'express'
import * as path from 'path'
import * as httpProxy from 'http-proxy'
import * as request from 'superagent'
import { brief } from './brief-route'

const staticsPath = path.join(__dirname, '..', '..', 'front', 'dist')

async function main() {
  const app = express()
  app.use(express.static(staticsPath))

  // proxy not used anymore (as of now) in favour of '/brief'
  // will propably remove this or find a use case
  // (like fetching transactions or publishing raw txs)
  {
    const proxy = httpProxy.createProxy({
      target: 'http://localhost:5171',
      auth: 'user:123456',
    })
    const middleware = (req, res, next) => {
      proxy.web(req, res, undefined, console.error)
    }

    app.get('/v2.0.0/account', middleware)
    app.get('/v2.0.0/account/transactions', middleware)
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
