import { exec } from '../lib/api'
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

export async function fetchLatestBlock(): Promise<BlockType> {
  const path = '/v2.0.0/latest-block'
  const remote = await exec<BlockTypeRemote>('GET', path)
  return {
    hash: remote.hash,
    number: parseInt(remote.number, 10),
    timestamp: new Date(parseInt(remote.timestamp, 10)),
  }
}
