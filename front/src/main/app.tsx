import * as Long from 'long'
import { h, app } from 'hyperapp'
import { NavView, Nav } from './nav'
import { HomeView } from './home'
import {
  Route, initialLocationState, LocationActions, rawLocationActions, locationSubscribe,
} from './lib/location'
import { LocationState } from './lib/location'
import { addresses } from './model/wallet'
import { BriefRemote, Account } from './model/api'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import { Maybe, maybe } from 'tsmonad'
import {
  TransactionsView, TxsState, initialTxsState, TxsActions,
  rawTxsActions,
} from './transactions'
import { DelegatesView } from './delegates'
import { SendView, SendState, initialSendState, SendActions, rawSendActions } from './send'
import * as semux from 'semux'

export interface State {
  location: LocationState
  blockNumber: Maybe<BigNumber>
  blockTime: Maybe<DateTime>
  accounts: Account[]
  send: SendState
  transactions: TxsState
}

const initialState: State = {
  location: initialLocationState,
  blockNumber: Maybe.nothing(),
  blockTime: Maybe.nothing(),
  accounts: [],
  send: initialSendState,
  transactions: initialTxsState,
}

export interface Actions {
  location: LocationActions
  briefFetch: () => (s: State, a: Actions) => void
  briefResponse: (response: BriefRemote) => (s: State, a: Actions) => State
  send: SendActions
  transactions: TxsActions

}

const rawActions: Actions = {
  location: rawLocationActions,
  briefFetch: () => (state, actions) => {
    fetch(`/brief?addresses=${state.location.params.addr}`, { method: 'GET' })
      .then((r) => r.json())
      .then(actions.briefResponse)
  },
  briefResponse: (r: BriefRemote) => (state, actions) => {
    return {
      ...state,
      blockNumber: maybe(new BigNumber(r.blockNumber)),
      blockTime: maybe(DateTime.fromMillis(parseInt(r.blockTime, 10))),
      accounts: r.accounts.map((ra) => ({
        address: ra.address,
        available: new BigNumber(ra.available).div(1e9),
        locked: new BigNumber(ra.locked).div(1e9),
        nonce: Long.fromString(ra.nonce),
        transactionCount: ra.transactionCount,
      })),
    }
  },
  send: rawSendActions,
  transactions: rawTxsActions,
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
locationSubscribe(actions.location.setCurrent)
locationSubscribe((locationState) => {
  if (locationState.route === Nav.Transactions) {
    actions.transactions.fetch({ locationState })
  }
})
actions.briefFetch()

setInterval(actions.briefFetch, 10000)
