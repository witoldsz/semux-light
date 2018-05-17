import { h, app } from 'hyperapp'
import { State, Actions } from '../app'
import { readJsonInputFile } from '../lib/utils'
import { WalletState, Wallet } from '../model/wallet'

export interface WelcomeState {
  action: Action | undefined
  errorMessage: string
}

export const initialWelcomeState: WelcomeState = {
  action: undefined,
  errorMessage: '',
}

enum Action {
  Load,
  CreateNew,
  ImportKey,
}

export interface WelcomeActions {
  setAction: (_: Action) => (s: WelcomeState) => WelcomeState
  setError: (_: any) => (s: WelcomeState) => WelcomeState
  load: (_: [Actions, HTMLInputElement]) => (s: WelcomeState, a: WelcomeActions) => WelcomeState
}

export const rawWelcomeActions: WelcomeActions = {
  setAction: (action) => (state) => ({ ...state, action }),
  setError: (error = '') => (state) => (
    { ...state,
      errorMessage: error.message || error.toString(),
    }
  ),
  load: ([rootActions, inputElem]) => (state, actions) => {
    readJsonInputFile(inputElem)
      .then(rootActions.setWallet)
      .catch(actions.setError)
    return { ...state, action: Action.Load }
  },
}

export const WelcomeView = () => (rootState: State, rootActions: Actions) => {
  const state = rootState.welcome
  const actions = rootActions.welcome
  return <div class="pa3">
    <h1>Welcome to the Semux Light!</h1>
    { state.errorMessage && <p class="dark-red">{state.errorMessage}</p> }
    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={state.action === Action.Load}
          onclick={() => document.getElementById('load')!.click()}
        />{' '}
        Load account from wallet
      </label>
      <div class="clip">
        <input
          type="file"
          id="load"
          onchange={(evt) => actions.load([ rootActions, evt.target])}
        />
      </div>
    </div>
    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          onclick={() => actions.setAction(Action.CreateNew)}
        />{' '}
        Create new account
    </label>
    </div>
  </div>
}
