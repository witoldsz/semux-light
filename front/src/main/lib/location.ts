import { h } from 'hyperapp'
import { State } from '../app'
import { addresses } from '../model/wallet'

export interface LocationState {
  route: string,
  params: { [index: string]: string },
}

export const blankState: LocationState = {
  route: '',
  params: {},
}

export const parseLocation: (hash: string) => LocationState = (hash) => {
  return hash
    .substr(1)
    .split('/')
    .filter((i) => i)
    .reduce((acc: LocationState, elem: string) => {
      const [route, paramsStr] = elem.split('?')
      const params = (paramsStr
        ? paramsStr
          .split('&')
          .filter((i) => i)
          .reduce((acc, pair) => {
            const [key, val] = pair.split('=')
            return {
              [decodeURIComponent(key)]: decodeURIComponent(val),
              ...acc,
            }
          }, {})
        : undefined
      )
      return {
        route: acc.route + (acc.route ? '/' : '') + route,
        params: { ...params, ...acc.params },
      }
    }, blankState)
}

export interface LocationActions {
  setCurrent: (hash: string) => (s: LocationState) => LocationState
}

export const actions: LocationActions = {
  setCurrent: (hash: string) => (s: LocationState) => parseLocation(hash),
}

export type Subscribe = (a: LocationActions) => void

export const subscribe: Subscribe = (a: LocationActions) => {
  const listener = (e: HashChangeEvent) => {
    a.setCurrent(window.location.hash)
  }
  a.setCurrent(window.location.hash)
  window.addEventListener('hashchange', listener, false)
}

type LinkProps = { to: string } & JSX.IntrinsicElements
export const Link = (props: LinkProps, children) => (s: State) => {
  const { to, ...otherProps } = props
  return h('a', {
    href: `#/${to}?addr=${s.location.params.addr}`,
    ...otherProps,
  }, children)
}

export interface RouteProps { path: string, render: JSX.Element }

export const Route = (props: RouteProps) => (s: State) => (
  s.location.route === props.path ? props.render : undefined
)

function routeMatches(s: LocationState, path: string) {
  const c = s.route

}
