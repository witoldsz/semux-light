import { h, app } from 'hyperapp'
import { Actions, State } from './app'
import { Link } from './lib/location'

const INACTIVE_COLOR = 'black'
const ACTIVE_COLOR = 'blue'

export interface NavigationState {
  mobileMenuOpen: boolean
}

export const initialNavigationState: NavigationState = {
  mobileMenuOpen: false,
}

export interface NavigationActions {
  toggleMobileMenu: () => (s: NavigationState) => NavigationState
}

export const rawNavigationActions: NavigationActions = {
  toggleMobileMenu: () => (state) => ({ ...state, mobileMenuOpen: !state.mobileMenuOpen }),
}

export enum Nav {
  Home = 'home',
  Send = 'send',
  Receive = 'receive',
  Transactions = 'transactions',
  Delegates = 'delegates',
  Lock = 'lock',
}

const navLabels = {
  home: 'Home',
  send: 'Send',
  receive: 'Receive',
  transactions: 'Transactions',
  delegates: 'Delegates',
  lock: 'Lock',
}

export const NavView = () => (s: State, a: Actions) => (
  <div class="pa2">
    <div class={`dn-l bb bg-light-yellow ${navClass.join(' ')}`} onclick={() => {a.navigation.toggleMobileMenu()}}>
      <NavLabel nav={s.location.route} />
      <NavArrow open={s.navigation.mobileMenuOpen}/>
    </div>
    <div class={s.navigation.mobileMenuOpen ? 'db db-l' : 'dn db-l'}>
      <NavLink nav={Nav.Home} />
      <NavLink nav={Nav.Send} />
      <NavLink nav={Nav.Receive} />
      <NavLink nav={Nav.Transactions} />
      <NavLink nav={Nav.Delegates} />
      <NavButton nav={Nav.Lock} onclick={() => {a.setWallet(undefined)}}/>
    </div>
  </div>
)

interface NavProps { nav: Nav, onclick?: () => void }

const NavLink = (props: NavProps) => (s: State) => (
  <Link
    to={props.nav}
    class={navClass.concat([
      s.location.route === props.nav ? ACTIVE_COLOR : INACTIVE_COLOR,
    ]).join(' ')}
  >
    <NavLabel nav={props.nav} />
  </Link>
)

const NavButton = (props: NavProps) => (
  <button class={navClass.join(' ')} onclick={props.onclick}>
    <NavLabel nav={props.nav} />
  </button>
)

const NavLabel = (prop) => [
  navLabels[prop.nav] ? <img src={`resources/${prop.nav}.png`} class="w2 h2" /> : '',
  <span class="pl1"> {`${navLabels[prop.nav] || 'Menu'}`}</span>,
]

interface NavArrowProps {
  open: boolean
}

const NavArrow = (prop: NavArrowProps) => (
  <div class={`ml-auto f3 ${prop.open ? 'rotate-270' : 'rotate-90'}`}>&raquo;</div>
)

const navClass = [
  'f5',
  'no-underline',
  'bg-animate',
  'inline-flex',
  'items-center',
  'ph2',
  'pv1',
  'bt',
  'bl',
  'br',
  'bb-l',
  'b--black',
  'border-box',
  'mr3',
  'w-100',
  'w-auto-l',
]
