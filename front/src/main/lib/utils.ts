import { Buffer } from 'buffer'
import { BigNumber } from 'bignumber.js'

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

export function readJsonInputFile(e: HTMLInputElement): Promise<any> {
  return new Promise((success, err) =>  {
    if (e.files && e.files.length > 0 && e.files.item(0)) {
      const reader = new FileReader()
      reader.readAsText(e.files.item(0) as File)
      reader.onload = () => {
        try {
          success(JSON.parse(reader.result))
        } catch (e) {
          err(e)
        }
      }
      reader.onerror = () => err(reader.error)
    }
  })
}
