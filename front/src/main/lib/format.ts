import { BigNumber } from 'bignumber.js'
import * as Long from 'long'
import { Maybe, maybe } from 'tsmonad'
import { State } from '../app'

export function addressAbbr(s: string): string {
  return s ? `${s.substr(0, 6)}…${s.substr(s.length - 4, 4)}` : ''
}

export function transfer(a1: string, a2: string) {
  return `${addressAbbr(a1)} → ${addressAbbr(a2)}`
}

export function sem(amount: BigNumber): string {
  return `${semNoLabel(amount)} SEM`
}

export function semNoLabel(amount: BigNumber): string {
  return amount.toFormat()
}

export function localeDateTime(d: Date) {
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}
