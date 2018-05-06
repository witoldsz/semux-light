import * as Long from 'long'
import BigNumber from 'bignumber.js'
import { Buffer } from 'buffer'
import Transaction from 'semux/dist/types/lib/Transaction'
import { SemuxApi } from 'semux/dist/types/lib/api'
import { TransactionType, TransactionTypeRemote, TransactionTypeRes } from './transaction'
import { Either, either } from 'tsmonad'
import { mutableReverse } from '../lib/utils'

export interface BriefRemote {
  blockNumber: string
  blockTime: string
  accounts: AccountRemote[]
}

export interface AccountRemote {
  address: string
  available: string
  locked: string
  nonce: string
  transactionCount: number
}

export interface Account {
  address: string
  available: BigNumber
  locked: BigNumber
  nonce: Long
  transactionCount: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  result?: T
}

export function publishTx(tx: Transaction): Promise<Either<string, any>> {
  const encodedTx = Buffer.from(tx.toBytes().buffer).toString('hex')
  return exec('POST', `/v2.0.0/transaction/raw?raw=${encodedTx}`)
}

export async function fetchTxs(address: string, from: number, to: number): Promise<TransactionTypeRes> {
  const path = `/v2.0.0/account/transactions?address=${address}&from=${from}&to=${to}`
  const remoteE =  await exec<TransactionTypeRemote[]>('GET', path)
  return remoteE.fmap((remotes) => mutableReverse(remotes.map((r) => ({
    blockNumber: r.blockNumber,
    hash: r.hash,
    type: r.type,
    from: r.from,
    to: r.to,
    value: new BigNumber(r.value).div(1e9),
    fee: new BigNumber(r.fee).div(1e9),
    nonce: Long.fromString(r.nonce),
    timestamp: new Date(parseInt(r.timestamp, 10)),
    data: r.data,
  }))))
}

function exec<T>(method: string, path: string): Promise<Either<string, T>> {
  return fetch(path, { method })
    .then((response) => response.json())
    .then((json) => wrapResponseBody<T>(json))
    .catch((e) => Either.left(e.message))
}

function wrapResponseBody<T>({ success, message, result }: ApiResponse<T>): Either<string, T> {
  return either(
    (success ? undefined : message),
    (success ? result : undefined),
  )
}
