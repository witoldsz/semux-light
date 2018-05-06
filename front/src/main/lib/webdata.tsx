import { Either } from 'tsmonad'

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

export function errorOf(a: WebData<any>): string {
  return (a instanceof Either
    ? a.caseOf({
      left: (err) => err,
      right: () => '',
    })
    : ''
  )
}

export interface WebDataCasePatterns<TA, TB> {
  notAsked: (() => TB)
  loading: (() => TB)
  failure: ((s: string) => TB)
  success: ((r: TA) => TB)
}

export function caseWebDataOf<TA, TB>(a: WebData<TA>, pattern: WebDataCasePatterns<TA, TB>): TB {
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
