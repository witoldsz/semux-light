import { Buffer } from 'buffer'
import { Key } from 'semux-js'
import { decrypt, encrypt, randomIv, randomSalt } from '../lib/aes'
import { Password } from '../lib/password'
import { hexBytes } from '../lib/utils'

export type WalletState = { wallet: Wallet, password: Password } | undefined

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

export function validateWallet(file: string, network: string): Wallet {

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
  const state = { wallet, password }
  for (let i = 0; i < wallet.accounts.length; ++i) {
    const account = wallet.accounts[i]
    const key = getKey(state, i)
    throwIf(
      account.address.replace('0x', '') !== key.toAddressHexString().replace('0x', ''),
      'Invalid password.')
  }
  return state
}

function throwIf(cond: boolean, msg: string) {
  if (cond) {
    throw new Error(msg)
  }
}

function semuxKeyFromHex(privKeyHex: string): Key {
  const privKey = new Uint8Array(Buffer.from(privKeyHex.replace('0x', ''), 'hex'))
  return Key.importEncodedPrivateKey(privKey)
}

export function createNewWallet(password: Password, network: string, privKeysHex: string[]): Wallet {
  const salt = randomSalt()
  const iv = randomIv()
  const privKeys = privKeysHex.length > 0
    ? privKeysHex.map(semuxKeyFromHex)
    : [ Key.generateKeyPair() ]

  const newWallet: Wallet = {
    version: 1,
    network,
    cipher: { salt, iv },
    accounts: privKeys.map((key) => {
      const { encryptedPrivKey } = encrypt({ salt, iv, password, key })
      return {
        address: `0x${key.toAddressHexString()}`,
        encrypted: encryptedPrivKey,
      }
    }),
  }
  return newWallet
}

export function accounts(s: WalletState): Account[] {
  return s ? s.wallet.accounts : []
}

export function addresses(s: WalletState): string[] {
  return accounts(s).map((account) => account.address)
}

export function address1st(s: WalletState): string {
  return addresses(s)[0] || ''
}

export function getKey(state: WalletState, accountIdx: number): Key {
  if (!state) {
    throw new Error('no wallet')
  }
  const { wallet, password } = state
  const privKey = decrypt({
    salt: wallet.cipher.salt,
    iv: wallet.cipher.iv,
    password: state.password,
    encryptedPrivKey: wallet.accounts[accountIdx].encrypted,
  })
  const privKeyBytes = hexBytes(privKey)
  try {
    return Key.importEncodedPrivateKey(privKeyBytes)
  } catch (err) {
    throw new Error('Invalid password.')
  }
}

export function walletHref(wallet: Wallet) {
  const data = JSON.stringify(wallet, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  return URL.createObjectURL(blob)
}
