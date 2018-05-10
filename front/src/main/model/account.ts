import { exec } from './api'
import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'

export interface AccountTypeRemote {
  address: string
  available: string
  locked: string
  nonce: string
  transactionCount: number
}

export interface AccountType {
  address: string
  available: BigNumber
  locked: BigNumber
  nonce: number
  transactionCount: number
}

export type AccountTypeResponse = Either<string, AccountType>

export async function fetchAccount(address: string): Promise<AccountTypeResponse> {
  const path = `/v2.0.0/account?address=${address}`
  const remoteE = await exec<AccountTypeRemote>('GET', path)
  return remoteE.fmap((r) => ({
    address: r.address,
    available: new BigNumber(r.available).div(1e9),
    locked: new BigNumber(r.locked).div(1e9),
    nonce: parseInt(r.nonce, 10),
    transactionCount: r.transactionCount,
  }))
}
