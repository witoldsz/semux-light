import { Maybe } from 'tsmonad'
import semux from 'semux'
import { encrypt, decrypt } from '../lib/aes'
import { Password } from '../lib/password'
import { hexBytes } from '../lib/utils'
import Key from 'semux/dist/types/lib/Key'

export type WalletState = Wallet & { password: Password } | undefined

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

export function validateWallet(json: any, password: Password, network: string): Wallet {
  // TODO: validate structure, check password
  if (!json) {
    throw new Error('Wallet file not loaded.')
  }
  return json as Wallet
}

export function createNewWallet(password: Password, network: string): Wallet {
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

export function accounts(s: WalletState): Account[] {
  return s ? s.accounts : []
}

export function addresses(s: WalletState): string[] {
  return accounts(s).map((account) => account.address)
}

export function address1st(s: WalletState): string {
  return s && s.accounts[0]
    ? s.accounts[0].address
    : ''
}

export function getKey(s: WalletState, accountIdx: number): Key {
  if (!s) {
    throw new Error('no wallet')
  }
  const privKey = decrypt({
    salt: s.cipher.salt,
    iv: s.cipher.iv,
    password: s.password,
    encryptedPrivKey: s.accounts[accountIdx].encrypted,
  })
  return semux.Key.importEncodedPrivateKey(hexBytes(privKey))
}
