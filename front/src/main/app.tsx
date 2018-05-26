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
import { successOf, isSuccess, isFailure, failureOf, isLoading, NotAsked } from './lib/webdata'
import { ReceiveView, initialReceiveState, ReceiveState, ReceiveActions, rawReceiveActions } from './panels/receive'

export interface State {
  location: LocationState
  info: InfoState
  wallet: WalletState
  /* panels: */
  welcome: WelcomeState
  home: HomeState
  send: SendState
  receive: ReceiveState
  transactions: TxsState
  delegates: DelegatesState
}

const initialState: State = {
  location: initialLocationState,
  info: NotAsked,
  wallet: undefined,
  /* panels: */
  welcome: initialWelcomeState,
  home: initialHomeState,
  send: initialSendState,
  receive: initialReceiveState,
  transactions: initialTxsState,
  delegates: blankDelegates,
}

export interface Actions {
  setInfo: (i: InfoState) => (s: State) => State
  setWallet: (w: WalletState) => (s: State) => State
  /* panels: */
  welcome: WelcomeActions
  location: LocationActions
  home: HomeActions
  send: SendActions
  receive: ReceiveActions
  transactions: TxsActions
  delegates: DelegatesActions
}

const rawActions: Actions = {
  setInfo: (infoState) => (state) => ({ ...state, info: infoState }),
  setWallet: (walletState) => (state) => ({ ...state, wallet: walletState }),
  /* panels: */
  welcome: rawWelcomeActions,
  location: rawLocationActions,
  home: rawHomeActions,
  send: rawSendActions,
  receive: rawReceiveActions,
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
    <p class="pa2 dark-red">{failureOf(state.info)}</p>
    {isLoading(state.info) && <p class="tc pa3">Please wait</p>}
    {isSuccess(state.info) &&
      !state.wallet
        ? <WelcomeView />
        :
        <div>
          <h1 class="pa2">Semux Light</h1>
          <NavView />
          <Route path={Nav.Home} render={HomeView} />
          <Route path={Nav.Send} render={SendView} />
          <Route path={Nav.Receive} render={ReceiveView} />
          <Route path={Nav.Transactions} render={TransactionsView} />
          <Route path={Nav.Delegates} render={DelegatesView} />
        </div>
    }
    {/*
    <hr />
    <p>debug:</p>
    <pre> {JSON.stringify(state, null, 4)}</pre>
    */}
  </div>
)

const actions = app(initialState, rawActions, view, document.body)

fetchInfo().then(actions.setInfo)

locationSubscribe((locationState) => {
  actions.location.setCurrent(locationState)
})
