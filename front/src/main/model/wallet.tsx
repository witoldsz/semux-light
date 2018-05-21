import Network from 'semux/dist/types/lib/Network'
import { Maybe } from 'tsmonad'
import semux from 'semux'
import { encrypt, decrypt } from '../lib/aes'

export type WalletState = Wallet | undefined

export interface Wallet {
  version: number
  network: string
  cipher: { salt: string, iv: string }
  accounts: Account[]
}

export interface Account {
  address: string
  encrypted: string
}

export interface WalletActions {
  load: () => void
}

export async function readWallet(json: any): Promise<Wallet | undefined> {
  // TODO: validate
  return json as Wallet
}

export function createNewWallet(password: string, network: string): Wallet {
  const newKey = semux.Key.generateKeyPair()
  const { salt, iv, encryptedPrivKey } = encrypt({ password, key: newKey })
  const newWallet: Wallet = {
    version: 1,
    network,
    cipher: { salt, iv },
    accounts: [{
      address: `0x${newKey.toAddressHexString()}`,
      encrypted: encryptedPrivKey,
    }],
  }
  return newWallet
}

export function addresses(s: WalletState): string[] {
  return s
    ? s.accounts.map((account) => account.address)
    : []
}

export function address1st(s: WalletState): string {
  return s && s.accounts[0]
    ? s.accounts[0].address
    : ''
}
