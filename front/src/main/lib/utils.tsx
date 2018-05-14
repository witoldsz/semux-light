import { Buffer } from 'buffer'
import BigNumber from 'bignumber.js'

export const ZERO = new BigNumber(0)

export function log(s, result) {
  console.log(s, result)
  return result
}

export function hexBytes(s: string): Uint8Array {
  return Buffer.from(s.replace('0x', ''), 'hex')
}

export function mutableReverse<T>(array: T[]): T[] {
  array.reverse()
  return array
}

export function concat<T>(arrays: T[][]): T[] {
  return Array.prototype.concat.apply([], arrays)
}
