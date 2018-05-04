import { Either } from 'tsmonad'

export type WebData<T> = 'NotAsked' | 'Loading' | Either<string, T>

export function isNotAsked(a: WebData<any>): boolean {
  return a === 'NotAsked'
}

export function isLoading(a: WebData<any>): boolean {
  return a === 'Loading'
}

export function isError(a: WebData<any>): boolean {
  return a instanceof Either && a.caseOf({
    // TODO: waiting for release with https://github.com/cbowdon/TsMonad/pull/45
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
