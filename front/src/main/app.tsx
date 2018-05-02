import { h, app } from 'hyperapp'
import { NavView, Nav } from './nav'
import { HomeView } from './home'
import { Route } from './lib/location'
import * as location from './lib/location'
import { addresses } from './model/wallet'
import { BriefRemote, Account } from './model/api'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import { Maybe, maybe } from 'tsmonad'
import { TransactionsView } from './transactions'
import { DelegatesView } from './delegates'
import { SendView } from './send'

export interface State {
  location: location.LocationState
  blockNumber: Maybe<BigNumber>
  blockTime: Maybe<DateTime>
  accounts: Account[]
}

const initialState: State = {
  location: location.blankState,
  blockNumber: Maybe.nothing(),
  blockTime: Maybe.nothing(),
  accounts: [],
}

export interface Actions {
  location: location.LocationActions
  briefFetch: () => (s: State, a: Actions) => void
  briefResponse: (response: BriefRemote) => (s: State, a: Actions) => State
}

const rawActions: Actions = {
  location: location.actions,
  briefFetch: () => (s: State, a: Actions) => {
    fetch(`/brief?addresses=${s.location.params.addr}`, { method: 'GET' })
      .then((r) => r.json())
      .then(a.briefResponse)
  },
  briefResponse: (r: BriefRemote) => (s: State, a: Actions) => {
    return {
      ...s,
      blockNumber: maybe(new BigNumber(r.blockNumber)),
      blockTime: maybe(DateTime.fromMillis(parseInt(r.blockTime, 10))),
      accounts: r.accounts.map((ra) => ({
        address: ra.address,
        available: new BigNumber(ra.available).div(1e9),
        locked: new BigNumber(ra.locked).div(1e9),
        nonce: new BigNumber(ra.nonce),
        transactionCount: ra.transactionCount,
      })),
    }
  },
}

const view = (s: State, a: Actions) => (
  <div class="w-100 sans-serif">
    <h1 class="pa2">Semux Light</h1>
    <NavView />
    <Route path={Nav.Home} render={HomeView} />
    <Route path={Nav.Send} render={SendView} />
    <Route path={Nav.Transactions} render={TransactionsView} />
    <Route path={Nav.Delegates} render={DelegatesView} />
    <pre> {JSON.stringify(s, null, 4)}</pre>
  </div>
)

const actions = app(initialState, rawActions, view, document.body)
location.subscribe(actions.location)

actions.briefFetch()
setInterval(actions.briefFetch, 10000)
