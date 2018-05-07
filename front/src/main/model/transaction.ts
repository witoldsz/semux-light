import * as Long from 'long'
import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'
import { exec } from './api'
import { mutableReverse } from '../lib/utils'
import Transaction from 'semux/dist/types/lib/Transaction'
import { Buffer } from 'buffer'

export interface TransactionTypeRemote {
  blockNumber: string
  hash: string
  type: string
  from: string
  to: string
  value: string
  fee: string
  nonce: string
  timestamp: string
  data: string
}

export interface TransactionType {
  blockNumber: string
  hash: string
  type: string
  from: string
  to: string
  value: BigNumber
  fee: BigNumber
  nonce: Long
  timestamp: Date
  data: string
}

export type TransactionTypeRes = Either<string, TransactionType[]>

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

export function publishTx(tx: Transaction): Promise<Either<string, any>> {
  const encodedTx = Buffer.from(tx.toBytes().buffer).toString('hex')
  return exec('POST', `/v2.0.0/transaction/raw?raw=${encodedTx}`)
}
