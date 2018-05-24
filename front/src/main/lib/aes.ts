import * as forge from 'node-forge'
import semux from 'semux'
import { Password } from './password'

const { random, pkcs5  } = forge
const { createBuffer, hexToBytes } = forge.util
const { createCipher, createDecipher } = forge.cipher

const PBKDF2_ITERATIONS = Math.pow(2, 12)
const AES_KEY_LEN = 24 // AES-192

export interface EncryptOpts {
  salt: string
  iv: string
  key: { getEncodedPrivateKey: () => Uint8Array } // use 'Key': https://github.com/semuxproject/semux-js-sdk/issues/24
  password: Password
}

/** @returns AES encrypted PKCS#8 private key as HEX string */
export function encrypt({ salt, iv, key, password }: EncryptOpts) {
  const saltB = hexToBytes(salt)
  const ivB = hexToBytes(iv)

  const aesKey = pkcs5.pbkdf2(password.value, saltB, PBKDF2_ITERATIONS, AES_KEY_LEN)
  const cipher = createCipher('AES-CBC', aesKey)
  cipher.start({ iv: ivB })
  cipher.update(createBuffer(key.getEncodedPrivateKey()))
  cipher.finish()
  return {
    salt,
    iv,
    encryptedPrivKey: cipher.output.toHex(),
  }
}

export interface DecryptOpts {
  salt: string
  iv: string
  password: Password
  encryptedPrivKey: string
}

export function decrypt({ salt, iv, password, encryptedPrivKey }: DecryptOpts): string {
  const saltB = hexToBytes(salt)
  const ivB = hexToBytes(iv)
  const aesKey = pkcs5.pbkdf2(password.value, saltB, PBKDF2_ITERATIONS, AES_KEY_LEN)
  const decipher = createDecipher('AES-CBC', aesKey)
  decipher.start({ iv: ivB })
  decipher.update(createBuffer(hexToBytes(encryptedPrivKey)))
  decipher.finish()
  return decipher.output.toHex()
}

export function randomSalt(): string {
  return createBuffer(random.getBytesSync(16)).toHex()
}

export function randomIv(): string {
  return createBuffer(random.getBytesSync(16)).toHex()
}
