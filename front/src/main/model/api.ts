import BigNumber from 'bignumber.js'
import { Buffer } from 'buffer'
import Transaction from 'semux/dist/types/lib/Transaction'

export interface BriefRemote {
  blockNumber: string
  blockTime: string
  accounts: AccountRemote[]
}

export interface AccountRemote {
  address: string
  available: string
  locked: string
  nonce: string
  transactionCount: number
}

export interface Account {
  address: string
  available: BigNumber
  locked: BigNumber
  nonce: Long
  transactionCount: number
}

export interface SemuxApiResponse<T> {
  success: boolean
  message: string
  result?: T
}

export async function publishTx(tx: Transaction): Promise<SemuxApiResponse<any>> {
  const encodedTx = Buffer.from(tx.toBytes().buffer).toString('hex')
  const response = await fetch(`/v2.0.0/transaction/raw?raw=${encodedTx}`, { method: 'POST' })
  return response.json().catch((e) => ({
    success: false,
    message: e.message ? e.message.toString() : '',
  }))
}
