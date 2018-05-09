import { BigNumber } from 'bignumber.js'
import * as Long from 'long'
import { Maybe, maybe } from 'tsmonad'
import { State } from '../app'
import { Account } from './api'

export function coinbase(s: State): Maybe<Account> {
  return maybe(s.accounts[0])
}

export function addressAbbr(s: string): string {
  return `${s.substr(0, 6)}…${s.substr(s.length - 4, 4)}`
}

export function sem(amount: BigNumber, showLabel = true): string {
  return amount.toFormat() + (showLabel ? ' SEM' : '')
}

export function nonce(s: State, address: string) {
  const acc = s.accounts.find(({ address: a }) => address === a)
  return acc ? acc.nonce : Long.ZERO
}
