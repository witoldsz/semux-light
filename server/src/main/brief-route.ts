import { RequestHandler } from 'express'
import { asyncMiddleware } from './lib/async-middleware'
import { settings } from './settings'
import { Endpoints } from './lib/api'
import { Either } from 'tsmonad'
import { catEithers } from './lib/tsmonad-extra'

export const brief: RequestHandler = asyncMiddleware(async (req, res, next) => {
  const addresses = (req.query.addresses as string || '').split(',')

  // execute requests first:
  const blockP = Endpoints.getLatestBlock()
  const accountsPs = addresses.map((address) => Endpoints.getAccount({ address }))

  // now we can (a)wait…
  const blockE = await blockP
  const accountsEs = await Promise.all(accountsPs)

  const responseE: Either<string, ResponseBody> = blockE.fmap((remote) => ({
    blockNumber: remote.number,
    blockTime: remote.timestamp,
    accounts: catEithers(accountsEs),
  }))

  responseE.do({
    left: (err) => res.status(500).send(err),
    right: (r) => res.send(r),
  })
})

export interface ResponseBody {
  blockNumber: string
  blockTime: string
  accounts: Account[]
}

export interface Account {
  address: string
  available: string
  locked: string
  nonce: string
  transactionCount: number
}
