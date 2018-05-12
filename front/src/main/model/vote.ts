import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'
import { exec } from './api'

export interface AccountVoteTypeRemote {
  delegate: {
    address: string,
  },
  votes: string,
}

export interface AccountVoteType {
  delegate: string
  votes: BigNumber
}

export async function fetchVotes(address: string): Promise<AccountVoteType[]> {
  const path = `/v2.0.0/account/votes?address=${address}`
  const remotes = await exec<AccountVoteTypeRemote[]>('GET', path)
  return remotes.map((r) => ({
    delegate: r.delegate.address,
    votes: new BigNumber(r.votes).div(1e9),
  }))
}
