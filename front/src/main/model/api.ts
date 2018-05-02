import BigNumber from 'bignumber.js'

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
  nonce: BigNumber
  transactionCount: number
}
