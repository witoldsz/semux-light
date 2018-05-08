import { Buffer } from 'buffer'
import BigNumber from 'bignumber.js'
import { Either } from 'tsmonad/lib/src'

export const ZERO = new BigNumber(0)

export function log(s, result) {
  console.log(s, result)
  return result
}

export function hexBytes(s: string): Uint8Array {
  return Buffer.from(s.replace('0x', ''), 'hex')
}

export function isRight(e: Either<any, any>) {
  return e.caseOf({
    right: () => true,
    left: () => false,
  })
}

export function isLeft(e: Either<any, any>) {
  return !isRight(e)
}

export function mutableReverse<T>(array: T[]): T[] {
  array.reverse()
  return array
}
