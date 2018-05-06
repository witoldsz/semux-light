import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'

export interface DelegateTypeRemote {
  address: string,
  name: string,
  registeredAt: string,
  votes: string,
  blocksForged: string,
  turnsHit: string,
  turnsMissed: string,
}

export interface DelegateType {
  address: string,
  name: string,
  votes: string,
  blocksForged: string,
  turnsHit: string,
  turnsMissed: string,
}

export type DelegateTypeRes = Either<string, DelegateType[]>
