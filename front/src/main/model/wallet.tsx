import Network from 'semux/dist/types/lib/Network'
import { Maybe } from 'tsmonad'

export type WalletState = Wallet | undefined

export interface Wallet {
  version: number
  network: Network
  accounts: Account[]
}

export interface Account {
  address: string
  encryptedPrivKey: Uint8Array
}

export interface WalletActions {
  load: () => void
}

export async function readWallet(json: any): Promise<Wallet | undefined> {
  return json as Wallet
}
