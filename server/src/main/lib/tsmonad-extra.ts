import { Maybe, Either } from 'tsmonad'

export function catMaybes<T>(list: Array<Maybe<T>>): T[] {
  return list.reduce((acc, e) => (e.caseOf({
    just: (e_) => [...acc, e_],
    nothing: () => acc,
  })), [])
}

export function catEithers<R>(list: Array<Either<any, R>>): R[] {
  return list.reduce((acc, itemE) => (itemE.caseOf({
    left: (err) => log(err, acc),
    right: (item) => [...acc, item],
  })), [])
}

export function log(msg, result) {
  console.log(msg, result)
  return result
}
