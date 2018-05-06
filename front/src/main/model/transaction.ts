import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'

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
