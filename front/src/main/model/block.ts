import { exec } from './api'
import { Either } from 'tsmonad'

export interface BlockTypeRemote {
  hash: string
  number: string
  timestamp: string
}
export interface BlockType {
  hash: string
  number: number
  timestamp: Date
}

export type BlockTypeResponse = Either<string, BlockType>

export async function fetchLatestBlock(): Promise<BlockTypeResponse> {
  const path = '/v2.0.0/latest-block'
  const remoteE = await exec<BlockTypeRemote>('GET', path)
  return remoteE.fmap((r) => ({
    hash: r.hash,
    number: parseInt(r.number, 10),
    timestamp: new Date(parseInt(r.timestamp, 10)),
  }))
}
