import * as Long from 'long'
import { h, app } from 'hyperapp'
import { NavView, Nav } from './nav'
import { HomeView, HomeState, initialHomeState, HomeActions, rawHomeActions } from './home'
import {
  Route, initialLocationState, LocationActions, rawLocationActions, locationSubscribe,
} from './lib/location'
import { LocationState } from './lib/location'
import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import { Maybe, maybe } from 'tsmonad'
import {
  TransactionsView, TxsState, initialTxsState, TxsActions,
  rawTxsActions,
} from './transactions'
import { DelegatesView, DelegatesState, blankDelegates, DelegatesActions, rawDelegatesActions } from './delegates'
import { SendView, SendState, initialSendState, SendActions, rawSendActions } from './send'
import * as semux from 'semux'
import { ZERO } from './lib/utils'

export interface State {
  location: LocationState
  blockNumber: BigNumber
  blockTime: Maybe<DateTime>
  accounts: Account[]
  home: HomeState
  send: SendState
  transactions: TxsState
  delegates: DelegatesState
}

const initialState: State = {
  location: initialLocationState,
  blockNumber: ZERO,
  blockTime: Maybe.nothing(),
  accounts: [],
  home: initialHomeState,
  send: initialSendState,
  transactions: initialTxsState,
  delegates: blankDelegates,
}

export interface Actions {
  location: LocationActions
  briefFetch: () => (s: State, a: Actions) => void
  home: HomeActions
  send: SendActions
  transactions: TxsActions
  delegates: DelegatesActions
}

const rawActions: Actions = {
  location: rawLocationActions,
  briefFetch: () => (state, actions) => {
    actions.home.fetch(state.location)
  },
  home: rawHomeActions,
  send: rawSendActions,
  transactions: rawTxsActions,
  delegates: rawDelegatesActions,
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

locationSubscribe((locationState) => {
  actions.location.setCurrent(locationState)
  actions.transactions.fetch({ locationState })
})

actions.briefFetch()

setInterval(actions.briefFetch, 10000)
