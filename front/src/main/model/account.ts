import { exec } from '../lib/api'
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

export async function fetchAccount(address: string): Promise<AccountType> {
  const path = `/v2.1.0/account?address=${address}`
  const remote = await exec<AccountTypeRemote>('GET', path)
  return {
    address: remote.address,
    available: new BigNumber(remote.available).div(1e9),
    locked: new BigNumber(remote.locked).div(1e9),
    nonce: parseInt(remote.nonce, 10),
    transactionCount: remote.transactionCount,
  }
}
