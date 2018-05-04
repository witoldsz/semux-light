import { BigNumber } from 'bignumber.js'
import * as Long from 'long'
import { Maybe, maybe } from 'tsmonad'
import { State } from '../app'
import { Account } from './api'

export function addresses(s: State): string[] {
  return s.accounts.map((a) => a.address)
}

export function coinbase(s: State): Maybe<Account> {
  return maybe(s.accounts[0])
}

export function addressAbbr(a: Account): string {
  const s = a.address
  return `${s.substr(0, 6)}…${s.substr(s.length - 4, 4)}`
}

export function sem(amount: BigNumber): string {
  return `${amount.toFormat(2)} SEM`
}

export function nonce(s: State, address: string) {
  const acc = s.accounts.find(({ address: a }) => address === a)
  return acc ? acc.nonce : Long.ZERO
}
