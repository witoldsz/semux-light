import * as Long from 'long'
import BigNumber from 'bignumber.js'
import { SemuxApi } from 'semux/dist/types/lib/api'
import { TransactionType, TransactionTypeRemote, TransactionTypeRes } from './transaction'
import { Either, either } from 'tsmonad'

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

export function exec<T>(method: string, path: string): Promise<Either<string, T>> {
  return fetch(path, { method })
    .then((response) => response.json())
    .then((json) => wrapResponseBody<T>(json))
    .catch((e) => Either.left(e.message))
}

function wrapResponseBody<T>({ success, message, result }: ApiResponse<T>): Either<string, T> {
  return either(
    (success ? undefined : message),
    (success ? (result || ({} as any)) : undefined),
  )
}
