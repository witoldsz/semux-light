import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'
import { exec } from './api'

export interface AccountVoteTypeRemote {
  delegate: {
    address: string,
  },
  votes: string,
}

export interface AccountVote {
  delegate: string
  votes: BigNumber
}

export type VotesResponse = Either<string, AccountVote[]>

export async function fetchVotes(address: string): Promise<VotesResponse> {
  const path = `/v2.0.0/account/votes?address=${address}`
  const remotesE = await exec<AccountVoteTypeRemote[]>('GET', path)
  return remotesE.fmap((remotes) => remotes.map((r) => ({
    delegate: r.delegate.address,
    votes: new BigNumber(r.votes).div(1e9),
  })))
}
