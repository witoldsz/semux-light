import BigNumber from 'bignumber.js'

export const ZERO = new BigNumber(0)

export function log(s, result) {
  console.log(s, result)
  return result
}
