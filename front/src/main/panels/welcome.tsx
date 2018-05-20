import { h, app } from 'hyperapp'
import { State, Actions } from '../app'
import { readJsonInputFile } from '../lib/utils'
import { WalletState, Wallet, createNewWallet } from '../model/wallet'
import { InfoType } from '../model/info'
import { successOf } from '../lib/webdata'
import semux from 'semux'

export interface WelcomeState {
  action: Action | undefined
  errorMessage: string
  createMessage: string
}

export const initialWelcomeState: WelcomeState = {
  action: undefined,
  errorMessage: '',
  createMessage: '',
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
  create: (_: [string, string, State, Actions]) => (s: WelcomeState) => WelcomeState
}

export const rawWelcomeActions: WelcomeActions = {
  setAction: (action) => (state) => ({ ...state, action }),
  setError: (error = '') => (state) => (
    {
      ...state,
      errorMessage: error.message || error.toString(),
    }
  ),
  load: ([rootActions, inputElem]) => (state, actions) => {
    readJsonInputFile(inputElem)
      .then(rootActions.setWallet)
      .catch(actions.setError)
    return { ...state, action: undefined, errorMessage: '' }
  },
  create: ([password, password2, rootState, rootActions]) => (state) => {
    if (password !== password2) {
      return { ...state, createMessage: 'Passwords does not match' }
    }
    if (!password) {
      return { ...state, createMessage: 'Password cannot be empty' }
    }
    successOf(rootState.info).fmap((info) => {
      const wallet = createNewWallet(password, semux.Network.TESTNET)
      rootActions.setWallet(wallet)
    })

    return state
  },
}

export const WelcomeView = () => (rootState: State, rootActions: Actions) => {
  const state = rootState.welcome
  const actions = rootActions.welcome
  return <div class="pa3">
    <h1>Welcome to the Semux Light!</h1>
    {state.errorMessage && <p class="dark-red">{state.errorMessage}</p>}
    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={state.action === Action.Load}
          onclick={() => document.getElementById('load')!.click()}
        />{' '}
        Load wallet from file
      </label>
      <div class="clip">
        <input
          type="file"
          id="load"
          onchange={(evt) => actions.load([rootActions, evt.target])}
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
        Create new wallet
    </label>
    </div>
    {state.action === Action.CreateNew &&
      <div>
        <div class="mv3">
          <label class="fw7 f6">
            Password
            <input
              key="password"
              id="password"
              type="password"
              autocomplete="off"
              class="db pa2 br2 b--black-20 ba f6"
              oninput={(evt) => { }}
            />
          </label>
        </div>

        <div class="mv3">
          <label class="fw7 f6">
            Repeat password
            <input
              key="password2"
              id="password2"
              type="password"
              autocomplete="off"
              class="db pa2 br2 b--black-20 ba f6"
              oninput={(evt) => { }}
            />
          </label>
        </div>

        <div>
          <button onclick={() => actions.create([
            textInputById('password'),
            textInputById('password2'),
            rootState,
            rootActions,
          ])}>
            Create and save!
          </button><span class="ml2 dark-red">{state.createMessage}</span>
        </div>
      </div>
    }
  </div>
}

function textInputById(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value.trim()
}
