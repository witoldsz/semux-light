import * as forge from 'node-forge'
import semux from 'semux'

const { random, pkcs5  } = forge
const { createBuffer, hexToBytes } = forge.util
const { createCipher, createDecipher } = forge.cipher

const PBKDF2_ITERATIONS = Math.pow(2, 12)
const AES_KEY_LEN = 24 // AES-192

export interface EncryptOpts {
  salt?: string
  iv?: string
  key: { getEncodedPrivateKey: () => Uint8Array } // use 'Key': https://github.com/semuxproject/semux-js-sdk/issues/24
  password: string
}

/** @returns AES encrypted PKCS#8 private key as HEX string */
export function encrypt({ salt, iv, key, password }: EncryptOpts) {
  salt = salt || random.getBytesSync(16)
  iv = iv || random.getBytesSync(16)

  salt = hexToBytes('e9e5defb129ef8828bfbdba9d547b06b')
  iv = hexToBytes('6606b217ab936f1db70d6f189110d641')

  const aesKey = pkcs5.pbkdf2(password, salt, PBKDF2_ITERATIONS, AES_KEY_LEN)
  const cipher = createCipher('AES-CBC', aesKey)
  cipher.start({ iv })

  cipher.update(createBuffer(hexToBytes(
    '302e020100300506032b6570042204206555ecdfce75bfa5eb8ff0274f55e3651f5c068c3405c648609e7344e90236c5',
  )))

  // cipher.update(createBuffer(key.getEncodedPrivateKey()))
  cipher.finish()
  return {
    salt: createBuffer(salt).toHex(),
    iv: createBuffer(iv).toHex(),
    encryptedPrivKey: cipher.output.toHex(),
  }
}

export interface DecryptOpts {
  salt: string
  iv: string
  password: string
  encryptedPrivKey: string
}

export function decrypt({ salt, iv, password, encryptedPrivKey }: DecryptOpts): string {
  const saltB = hexToBytes(salt)
  const ivB = hexToBytes(iv)
  const aesKey = pkcs5.pbkdf2(password, saltB, PBKDF2_ITERATIONS, AES_KEY_LEN)
  const decipher = createDecipher('AES-CBC', aesKey)
  decipher.start({ iv: ivB })
  decipher.update(createBuffer(hexToBytes(encryptedPrivKey)))
  decipher.finish()
  return decipher.output.toHex()
}
