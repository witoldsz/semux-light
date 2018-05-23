import { exec } from '../lib/api'
import { Either } from 'tsmonad'
import BigNumber from 'bignumber.js'
import { WebData, Success, Failure } from '../lib/webdata'

export type InfoState = WebData<InfoType>

export interface InfoType {
  network: string
  clientId: BigNumber
  activePeers: number
}

export async function fetchInfo(): Promise<InfoState> {
  try {
    return Success(await exec<InfoType>('GET', `/v2.1.0/info`))
  } catch (e) {
    return Failure(e.message)
  }
}
