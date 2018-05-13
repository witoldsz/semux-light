import { Buffer } from 'buffer'
import BigNumber from 'bignumber.js'
import { Either, Maybe } from 'tsmonad'

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

export function takeLeft<L>(e: Either<L, any>): Maybe<L> {
  return e.caseOf({
    right: () => Maybe.nothing<L>(),
    left: (left) => Maybe.just(left),
  })
}

export function mutableReverse<T>(array: T[]): T[] {
  array.reverse()
  return array
}

export function firstEitherError(list: Array<Either<string, any>>): Maybe<string> {
  for (const i of list) {
    if (isLeft(i)) {
      return takeLeft(i)
    }
  }
  return Maybe.nothing()
}

export function catEithers<R>(list: Array<Either<any, R>>): R[] {
  return list.reduce((acc, itemE) => (itemE.caseOf({
    left: (err) => log(err, acc),
    right: (item) => [...acc, item],
  })), [])
}
