import * as Long from 'long'
import { h, app } from 'hyperapp'
import { NavView, Nav } from './nav'
import { HomeView, HomeState, initialHomeState, HomeActions, rawHomeActions } from './panels/home'
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
} from './panels/transactions'
import {
  DelegatesView, DelegatesState, blankDelegates, DelegatesActions, rawDelegatesActions,
} from './panels/delegates'
import { SendView, SendState, initialSendState, SendActions, rawSendActions } from './panels/send'
import * as semux from 'semux'
import { ZERO } from './lib/utils'
import { WelcomeView, WelcomeState, initialWelcomeState, WelcomeActions, rawWelcomeActions } from './panels/welcome'
import { WalletState } from './model/wallet'

export interface State {
  location: LocationState
  wallet: WalletState
  /* panels: */
  welcome: WelcomeState
  home: HomeState
  send: SendState
  transactions: TxsState
  delegates: DelegatesState
}

const initialState: State = {
  location: initialLocationState,
  wallet: Maybe.nothing(),
  /* panels: */
  welcome: initialWelcomeState,
  home: initialHomeState,
  send: initialSendState,
  transactions: initialTxsState,
  delegates: blankDelegates,
}

export interface Actions {
  briefFetch: () => (s: State, a: Actions) => void
  /* panels: */
  welcome: WelcomeActions
  location: LocationActions
  home: HomeActions
  send: SendActions
  transactions: TxsActions
  delegates: DelegatesActions
}

const rawActions: Actions = {
  briefFetch: () => (state, actions) => {
    actions.home.fetch(state.location)
  },
  /* panels: */
  welcome: rawWelcomeActions,
  location: rawLocationActions,
  home: rawHomeActions,
  send: rawSendActions,
  transactions: rawTxsActions,
  delegates: rawDelegatesActions,
}

const view = (s: State, a: Actions) => (
  <div>
    {
      1 === 1
        ? <WelcomeView />
        :
        <div>
          <h1 class="pa2">Semux Light</h1>
          <NavView />
          <Route path={Nav.Home} render={HomeView} />
          <Route path={Nav.Send} render={SendView} />
          <Route path={Nav.Transactions} render={TransactionsView} />
          <Route path={Nav.Delegates} render={DelegatesView} />
        </div>
    }
    <hr />
    <p>debug:</p>
    <pre> {JSON.stringify(s, null, 4)}</pre>
  </div>
)

const actions = app(initialState, rawActions, view, document.body)

locationSubscribe((locationState) => {
  actions.location.setCurrent(locationState)
  actions.transactions.fetch({ locationState })
})

// actions.briefFetch()

// setInterval(actions.briefFetch, 10000)
