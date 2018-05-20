import { Either, Maybe } from 'tsmonad'

export type WebData<T> = 'NotAsked' | 'Loading' | Either<string, T>

export function isNotAsked(a: WebData<any>): a is 'NotAsked' {
  return a === 'NotAsked'
}

export function isLoading(a: WebData<any>): a is 'Loading' {
  return a === 'Loading'
}

export function isError(a: WebData<any>): a is Either<string, any> {
  return a instanceof Either && a.caseOf({
    // TODO: waiting for release https://github.com/cbowdon/TsMonad/pull/45
    left: () => true,
    right: () => false,
  })
}

export function isSuccess<T>(a: WebData<T>): a is Either<string, T> {
  return a instanceof Either && a.caseOf({
    // TODO: waiting for release https://github.com/cbowdon/TsMonad/pull/45
    left: () => false,
    right: () => true,
  })
}

export function errorOf(a: WebData<any>): string {
  return (a instanceof Either
    ? a.caseOf({
      left: (err) => err,
      right: () => '',
    })
    : ''
  )
}

export function successOf<T>(a: WebData<T>): Maybe<T> {
  return (a instanceof Either
    ? a.caseOf({
      left: () => Maybe.nothing(),
      right: Maybe.just,
    })
    : Maybe.nothing()
  )
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
    : a.caseOf({
      left: pattern.failure,
      right: pattern.success,
    })
  )
}
