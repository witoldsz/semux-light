import * as request from 'superagent'
import { settings } from '../settings'
import { Either, EitherType, either } from 'tsmonad'

export const Endpoints = {
  getAccount: exec<AccountRemote>('GET', '/v2.0.0/account'),
  getLatestBlock: exec<BlockRemote>('GET', '/v2.0.0/latest-block'),
  getDelegates: exec<DelegatesRemote>('GET', '/v2.0.0/delegates'),
  getAccountVotes: exec<AccountVotesRemote>('GET', '/v2.0.0/account/votes'),
}

export interface AccountRemote {
  address: string
  available: string
  locked: string
  nonce: string
  transactionCount: number
}

export interface BlockRemote {
  hash: string
  number: string
  timestamp: string
}

export interface DelegatesRemote {
  address: string,
  name: string,
  registeredAt: string,
  votes: string,
  blocksForged: string,
  turnsHit: string,
  turnsMissed: string,
  validator: boolean,
}

export interface AccountVotesRemote {
  delegate: {
    address: string,
  },
  votes: string
}

function exec<T>(method: string, path: string): (query?) => Promise<Either<string, T>> {
  const api = settings.semuxApiService
  return (query) => (
    request(method, api.address + path)
      .auth(api.user, api.pass)
      .query(query)
      .then((response) => wrapResponseBody<T>(response.body))
      .catch((e) => Either.left(e.message))
  )
}

function wrapResponseBody<T>({ success, message, result }: ApiResponse<T>): Either<string, T> {
  return either(
    (success ? undefined : message),
    (success ? result : undefined),
  )
}

interface ApiResponse<T> {
  success: boolean
  message: string | undefined
  result: T | undefined
}
