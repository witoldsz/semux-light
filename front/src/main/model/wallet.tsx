import Network from 'semux/dist/types/lib/Network'
import { Maybe } from 'tsmonad'

export type WalletState = Maybe<Wallet>

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
