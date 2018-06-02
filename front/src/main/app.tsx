import { app, h } from 'hyperapp'
import {
  LocationActions, LocationState, Route, locationSubscribe, rawLocationActions, parseLocation,
} from './lib/location'
import { NotAsked, failureOf, isLoading, isSuccess, successOf } from './lib/webdata'
import { InfoState, fetchInfo } from './model/info'
import { WalletState } from './model/wallet'
import { Nav, NavView } from './nav'
import {
  DelegatesActions, DelegatesState, DelegatesView, blankDelegates, rawDelegatesActions,
} from './panels/delegates'
import { HomeActions, HomeState, HomeView, initialHomeState, rawHomeActions } from './panels/home'
import { ReceiveActions, ReceiveState, ReceiveView, initialReceiveState, rawReceiveActions } from './panels/receive'
import { SendActions, SendState, SendView, initialSendState, rawSendActions } from './panels/send'
import { TransactionsView, TxsActions, TxsState, initialTxsState, rawTxsActions } from './panels/transactions'
import { WelcomeActions, WelcomeState, WelcomeView, initialWelcomeState, rawWelcomeActions } from './panels/welcome'

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

function initialState(): State {
  return {
  location: parseLocation(),
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
}

export interface Actions {
  location: LocationActions
  setInfo: (i: InfoState) => (s: State) => State
  setWallet: (w: WalletState) => (s: State) => State
  /* panels: */
  welcome: WelcomeActions
  home: HomeActions
  send: SendActions
  receive: ReceiveActions
  transactions: TxsActions
  delegates: DelegatesActions
}

const rawActions: Actions = {
  location: rawLocationActions,
  setInfo: (infoState) => (state) => ({ ...state, info: infoState }),
  setWallet: (walletState) => (state) => ({
    ...initialState(),
    info: state.info,
    wallet: walletState,
  }),
  /* panels: */
  welcome: rawWelcomeActions,
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
    {isSuccess(state.info) && (
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
    )}
    {/*
    <hr />
    <p>debug:</p>
    <pre> {JSON.stringify(state, null, 4)}</pre>
    */}
  </div>
)

const actions = app(initialState(), rawActions, view, document.body)

fetchInfo().then(actions.setInfo)

locationSubscribe((locationState) => {
  actions.location.setCurrent(locationState)
})
