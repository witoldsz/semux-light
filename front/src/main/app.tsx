import * as Long from 'long'
import { h, app } from 'hyperapp'
import { NavView, Nav } from './nav'
import { HomeView, HomeState, initialHomeState, HomeActions, rawHomeActions } from './panels/home'
import {
  Route, initialLocationState, LocationActions, rawLocationActions, locationSubscribe,
} from './lib/location'
import { LocationState } from './lib/location'
import BigNumber from 'bignumber.js'
import { Maybe, maybe } from 'tsmonad'
import {
  TransactionsView, TxsState, initialTxsState, TxsActions,
  rawTxsActions,
} from './panels/transactions'
import {
  DelegatesView, DelegatesState, blankDelegates, DelegatesActions, rawDelegatesActions,
} from './panels/delegates'
import { SendView, SendState, initialSendState, SendActions, rawSendActions } from './panels/send'
import { ZERO } from './lib/utils'
import { WelcomeView, WelcomeState, initialWelcomeState, WelcomeActions, rawWelcomeActions } from './panels/welcome'
import { WalletState } from './model/wallet'
import { InfoType, InfoState, fetchInfo } from './model/info'
import { isError, errorOf, successOf, isSuccess } from './lib/webdata'

export interface State {
  location: LocationState
  info: InfoState
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
  info: 'NotAsked',
  wallet: undefined,
  /* panels: */
  welcome: initialWelcomeState,
  home: initialHomeState,
  send: initialSendState,
  transactions: initialTxsState,
  delegates: blankDelegates,
}

export interface Actions {
  briefFetch: () => (s: State, a: Actions) => void
  setInfo: (i: InfoState) => (s: State) => State
  setWallet: (w: WalletState) => (s: State) => State
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
    actions.home.fetch(state)
  },
  setInfo: (infoState) => (state) => ({ ...state, info: infoState }),
  setWallet: (walletState) => (state) => ({ ...state, wallet: walletState }),
  /* panels: */
  welcome: rawWelcomeActions,
  location: rawLocationActions,
  home: rawHomeActions,
  send: rawSendActions,
  transactions: rawTxsActions,
  delegates: rawDelegatesActions,
}

const view = (state: State, actions: Actions) => (
  <div>
    <p class="tc bg-yellow">
      {successOf(state.info)
        .fmap((i) => `Network: ${i.network}`)
        .valueOr('')
      }
    </p>
    {isError(state.info)
      ?
      <p class="pa2 dark-red">{errorOf(state.info)}</p>
      :
      isSuccess(state.info)
      ?
      !state.wallet
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
      :
      <p class="tc pa3">Please wait</p>
    }
    <hr />
    <p>debug:</p>
    <pre> {JSON.stringify(state, null, 4)}</pre>
  </div>
)

const actions = app(initialState, rawActions, view, document.body)

fetchInfo().then(actions.setInfo)

locationSubscribe((locationState) => {
  actions.location.setCurrent(locationState)
})

// actions.briefFetch()

// setInterval(actions.briefFetch, 10000)
