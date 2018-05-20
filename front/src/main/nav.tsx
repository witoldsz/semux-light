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
  Lock = 'lock',
}

export const NavView = () => (s: State, a: Actions) => (
  <div class="flex pa2">
    <NavLink nav={Nav.Home} label="Home" />
    <NavLink nav={Nav.Send} label="Send" />
    <NavLink nav={Nav.Receive} label="Receive"/>
    <NavLink nav={Nav.Transactions} label="Transactions" />
    <NavLink nav={Nav.Delegates} label="Delegates" />
    <NavButton nav={Nav.Lock} label="Lock" onclick={() => {a.setWallet(undefined)}}/>
  </div>
)

interface NavProps { nav: Nav, label: string, onclick?: () => void }

const NavLink = (props: NavProps) => (s: State) => (
  <Link
    to={props.nav}
    class={navClass.concat([
      s.location.route === props.nav ? ACTIVE_COLOR : INACTIVE_COLOR,
    ]).join(' ')}
  >
  { navInner(props) }
  </Link>
)

const NavButton = (props: NavProps) => (
  <button class={navClass.join(' ')} onclick={props.onclick}>
    { navInner(props) }
  </button>
)

const navInner = (prop) => [
  <img src={`resources/${prop.nav}.png`} class="w2 h2" />,
  <span class="pl1"> {`${prop.label}`}</span>,
]

const navClass = [
  'f5',
  'no-underline',
  'bg-animate',
  'inline-flex',
  'items-center',
  'ph2',
  'pv1',
  'ba',
  'b--black',
  'border-box',
  'mr3',
]
