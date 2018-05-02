import { h, app } from 'hyperapp'
import { Actions, State } from './app'
import { Link } from './lib/location'

const INACTIVE_COLOR = 'black'
const ACTIVE_COLOR = 'blue'

export enum Nav {
  Home = 'home',
  Send = 'send',
  Receive = 'receive',
  Transactions = 'transactions',
  Delegates = 'delegates',
}

export const NavView = () => (s: State, a: Actions) => (
  <div class="flex pa2">
    <NavButton nav={Nav.Home} label="Home" />
    <NavButton nav={Nav.Send} label="Send" />
    <NavButton nav={Nav.Receive} label="Receive"/>
    <NavButton nav={Nav.Transactions} label="Transactions" />
    <NavButton nav={Nav.Delegates} label="Delegates" isLast={true} />
  </div>
)

export interface NavProps { nav: Nav, label: string, isLast?: boolean }

const NavButton = (prop: NavProps) => (s: State) => (
  <Link to={prop.nav}
    class={[
      'f5',
      'no-underline',
      'bg-animate',
      'inline-flex',
      'items-center',
      'ph2',
      'pv1',
      'ba',
      'border-box',
      s.location.route === prop.nav ? ACTIVE_COLOR : INACTIVE_COLOR,
      (prop.isLast ? '' : 'mr3'),
    ].join(' ')}
  >
    <img src={`resources/${prop.nav}.png`} class="w2 h2" />
    <span class="pl1"> {`${prop.label}`}</span>
  </Link>
)
