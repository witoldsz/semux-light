import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'
import { exec } from '../lib/api'

export interface DelegateTypeRemote {
  address: string
  name: string
  registeredAt: string
  votes: string
  blocksForged: string
  turnsHit: string
  turnsMissed: string
  validator: boolean
}

export interface DelegateType {
  address: string
  name: string
  votes: BigNumber
  blocksForged: number
  turnsHit: number
  turnsMissed: number
  rate: number
  validator: boolean
}

export async function fetchDelegates(): Promise<DelegateType[]> {
  const path = '/v2.0.0/delegates'
  const remotes = await exec<DelegateTypeRemote[]>('GET', path)
  return remotes.map((r) => {
    const turnsHit = parseInt(r.turnsHit, 10)
    const turnsMissed = parseInt(r.turnsMissed, 10)
    const total = turnsHit + turnsMissed
    return {
      address: r.address,
      name: r.name,
      votes: new BigNumber(r.votes).div(1e9),
      blocksForged: parseInt(r.blocksForged, 10),
      turnsHit,
      turnsMissed,
      rate: total === 0 ? 0 : (turnsHit * 100 / total),
      validator: r.validator,
    }
  })
}
