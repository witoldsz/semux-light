import { Maybe } from 'tsmonad'

export const NotAsked: WebData<any> = 'NotAsked'
export const Loading: WebData<any> = 'Loading'

export function Success<A>(a: A): WebData<A> {
  return ['Success', a]
}
export function Failure(s: string): WebData<any> {
  return ['Failure', s]
}

export type WebData<A> =
  'NotAsked' |
  'Loading' |
  ['Success', A] |
  ['Failure', string]

export function isNotAsked(a: WebData<any>): a is 'NotAsked' {
  return a === 'NotAsked'
}

export function isLoading(a: WebData<any>): a is 'Loading' {
  return a === 'Loading'
}

export function isFailure(a: WebData<any>): a is ['Failure', string] {
  return a[0] === 'Failure'
}

export function isSuccess<A>(a: WebData<A>): a is ['Success', A] {
  return a[0] === 'Success'
}

export function failureOf(a: WebData<any>): string {
  return isFailure(a) ? a[1] : ''
}

export function successOf<A>(a: WebData<A>): Maybe<A> {
  return isSuccess(a) ? Maybe.just(a[1]) : Maybe.nothing()
}

export function fmapSuccess<A, B>(a: WebData<A>, fn: (a: A) => B): WebData<B> {
  return isSuccess(a) ? Success(fn(a[1])) : a
}

export interface WebDataCasePatterns<A, B> {
  notAsked: (() => B)
  loading: (() => B)
  failure: ((s: string) => B)
  success: ((r: A) => B)
}

export function caseWebDataOf<A, B>(a: WebData<A>, pattern: WebDataCasePatterns<A, B>): B {
  return (isNotAsked(a)
    ? pattern.notAsked()
    : isLoading(a)
    ? pattern.loading()
    : isSuccess(a)
    ? pattern.success(a[1])
    : pattern.failure(a[1])
  )
}
