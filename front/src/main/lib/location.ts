import { h } from 'hyperapp'
import { State } from '../app'
import { log } from './utils'

export interface LocationState {
  route: string
  params: {
    addr: string
    [index: string]: string,
  }
}

export const initialLocationState: LocationState = {
  route: '',
  params: {
    addr: '',
  },
}

export interface LocationActions {
  setCurrent: (s: LocationState) => LocationState
}

export const rawLocationActions: LocationActions = {
  setCurrent: (state: LocationState) => state,
}

export type Subscribe = (a: LocationActions) => void

export function locationSubscribe(sub: (s: LocationState) => any) {
  function listener() {
    sub(parseLocation(window.location.hash))
  }
  listener()
  window.addEventListener('hashchange', listener, false)
}

export function locationAddr1st(l: LocationState): string | undefined {
  return locationAddrs(l)[0]
}

export function locationAddrs(l: LocationState): string[] {
  return l.params.addr.split(',')
}

type LinkProps = { to: string } & JSX.IntrinsicElements
export const Link = (props: LinkProps, children) => (s: State) => {
  const { to, ...otherProps } = props
  return h('a', {
    href: `#/${to}?addr=${s.location.params.addr || ''}`,
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

function parseLocation(hash: string): LocationState {
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
              ...acc,
              [decodeURIComponent(key)]: decodeURIComponent(val),
            }
          }, {})
        : undefined
      )
      return {
        route: acc.route + (acc.route ? '/' : '') + route,
        params: { ...acc.params, ...params },
      }
    }, initialLocationState)
}
