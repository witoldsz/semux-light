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

export function validateWallet(file: string, password: Password, network: string): Wallet {

  throwIf(!file, 'Wallet file not loaded.')
  const fileFormat = (supp: string) => `Invalid wallet file format: ${supp}.`
  let wallet: Wallet
  try {
    wallet = JSON.parse(file)
  } catch (err) {
    throw new Error(fileFormat(err.message))
  }
  throwIf(wallet.version !== 1, 'Unrecognized wallet file version.')
  throwIf(wallet.network !== network,
    `Wallet is for ${wallet.network}, this is ${network}.`,
  )
  throwIf(!wallet.cipher, fileFormat('missing "cipher"'))
  throwIf(typeof wallet.cipher.iv !== 'string', fileFormat('missing "cipher.iv"'))
  throwIf(typeof wallet.cipher.salt !== 'string', fileFormat('missing "cipher.salt"'))
  throwIf(!(wallet.accounts instanceof Array), fileFormat('"accounts"'))
  throwIf(wallet.accounts.length < 1, fileFormat('empty accounts'))
  throwIf(typeof wallet.accounts[0].address !== 'string', ('"accounts.address"'))
  throwIf(typeof wallet.accounts[0].encrypted !== 'string', fileFormat('"account.encrypted"'))
  return wallet
}

export function validatePassword(wallet: Wallet, password: Password): WalletState {
  const walletState: WalletState = { ...wallet, password }
  for (let i = 0; i < wallet.accounts.length; ++i) {
    const account = wallet.accounts[i]
    const key = getKey(walletState, i)
    throwIf(
      account.address.replace('0x', '') !== key.toAddressHexString().replace('0x', ''),
      'Invalid password.')
  }
  return walletState
}

function throwIf(cond: boolean, msg: string) {
  if (cond) {
    throw new Error(msg)
  }
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
  const privKeyBytes = hexBytes(privKey)
  try {
    return semux.Key.importEncodedPrivateKey(privKeyBytes)
  } catch (err) {
    throw new Error('Invalid password.')
  }}
