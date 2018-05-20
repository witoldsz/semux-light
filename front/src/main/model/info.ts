import { exec } from '../lib/api'
import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'
import { WebData, successOf } from '../lib/webdata'

export type InfoState = WebData<InfoType>

export interface InfoType {
  network: string
  clientId: BigNumber
  activePeers: number
}

export async function fetchInfo(): Promise<InfoState> {
  try {
    return Either.right(await exec<InfoType>('GET', `/v2.0.0/info`))
  } catch (e) {
    return Either.left(e.message)
  }
}
