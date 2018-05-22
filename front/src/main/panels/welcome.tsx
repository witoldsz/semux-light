import { h, app } from 'hyperapp'
import { State, Actions } from '../app'
import { readJsonInputFile } from '../lib/utils'
import { WalletState, Wallet, createNewWallet, validateWallet } from '../model/wallet'
import { InfoType } from '../model/info'
import { successOf } from '../lib/webdata'
import semux from 'semux'
import { saveJsonFile } from '../lib/saveFile'
import { Password } from '../lib/password'

export interface WelcomeState {
  action: Action | undefined
  errorMessage: string
  createMessage: string
  walletFile: any
}

enum Action {
  Load,
  CreateNew,
  ImportKey,
}

export const initialWelcomeState: WelcomeState = {
  action: undefined,
  errorMessage: '',
  createMessage: '',
  walletFile: undefined,
}

export interface WelcomeActions {
  setAction: (_: Action) => (s: WelcomeState) => WelcomeState
  setError: (_: any) => (s: WelcomeState) => WelcomeState
  setWalletFileBody: (body: any) => (s: WelcomeState) => WelcomeState
  load: (_: [Actions, Password]) => (s: WelcomeState, a: WelcomeActions) => WelcomeState
  create: (_: [Password, Password, State, Actions]) => (s: WelcomeState) => WelcomeState
}

export const rawWelcomeActions: WelcomeActions = {
  setAction: (action) => (state) => ({ ...state, action }),

  setError: (error = '') => (state) => (
    {
      ...state,
      errorMessage: error.message || error.toString(),
    }
  ),

  setWalletFileBody: (body) => (state) => ({ ...state, walletFile: body}),

  load: ([rootActions, password]) => (state, actions) => {
    try {
      const wallet = validateWallet(state.walletFile, password, 'TESTNET')
      rootActions.setWallet({ ...wallet, password })
      return initialWelcomeState
    } catch (error) {
      return { ...state, errorMessage: error.message }
    }
  },

  create: ([password, password2, rootState, rootActions]) => (state) => {
    if (!password.equals(password2)) {
      return { ...state, createMessage: 'Passwords does not match' }
    }
    if (password.isEmpty()) {
      return { ...state, createMessage: 'Password cannot be empty' }
    }
    successOf(rootState.info).fmap((info) => {
      const wallet = createNewWallet(password, info.network)
      rootActions.setWallet({ ...wallet, password })
      saveJsonFile('semux-wallet.json', wallet)
    })

    return initialWelcomeState
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
          onclick={() => {
            actions.setAction(Action.Load)
            document.getElementById('load')!.click()
          }}
        />{' '}
        Load wallet from file
      </label>
      <div class="clip">
        <input
          type="file"
          id="load"
          onchange={(evt) => readJsonInputFile(evt.target).then(actions.setWalletFileBody)}
        />
      </div>
    </div>
    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={state.action === Action.CreateNew}
          onclick={() => actions.setAction(Action.CreateNew)}
        />{' '}
        Create new wallet
    </label>
    </div>
    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={state.action === Action.ImportKey}
          onclick={() => actions.setAction(Action.ImportKey)}
        />{' '}
        Import key into new wallet (TODO)
    </label>
    </div>
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
    {state.action === Action.CreateNew &&
      <div>
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
            passwordById('password'),
            passwordById('password2'),
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

function passwordById(id: string): Password {
  return new Password((document.getElementById(id) as HTMLInputElement).value)
}
