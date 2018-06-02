import { h } from 'hyperapp'
import { Actions, State } from '../app'
import { Password } from '../lib/password'
import { readInputFile } from '../lib/utils'
import { successOf } from '../lib/webdata'
import { Wallet, createNewWallet, validatePassword, validateWallet, walletHref } from '../model/wallet'

export interface WelcomeState {
  selected: SelectedAction
  loadAction: LoadAction
  createAction: CreateAction
}

type SelectedAction = '' | 'LoadAction' | 'CreateAction'

interface LoadAction {
  errorMsg: string
}

const loadAction: LoadAction = {
  errorMsg: '',
}

interface CreateAction {
  wallet: Wallet | undefined
  errorMsg: string
  importKeys: boolean
  myWalletIsSafeVisible: boolean
  myWalletIsSafe: boolean
}

const createAction: CreateAction = {
  wallet: undefined,
  errorMsg: '',
  importKeys: false,
  myWalletIsSafeVisible: false,
  myWalletIsSafe: false,
}

export const initialWelcomeState: WelcomeState = {
  selected: '',
  loadAction,
  createAction,
}

export interface WelcomeActions {
  setSelected: (_: SelectedAction) => (s: WelcomeState) => WelcomeState
  load: (_: [Password, string, State, Actions]) => (s: WelcomeState, a: WelcomeActions) => WelcomeState
  toggleImportKeys: () => (s: WelcomeState) => WelcomeState
  setMyWalletIsSafeVisibile: () => (s: WelcomeState) => WelcomeState
  toggleMyWalletIsSafe: () => (s: WelcomeState) => WelcomeState
  create: (_: [Password, Password, string[], State, Actions]) => (s: WelcomeState) => WelcomeState
  restoreInitialState: () => WelcomeState
}

export const rawWelcomeActions: WelcomeActions = {
  setSelected: (selected) => (state) => ({ ...state, selected }),

  load: ([password, walletFile, rootState, rootActions]) => (state, actions) => {
    try {
      successOf(rootState.info).fmap((info) => {
        const wallet = validateWallet(walletFile, info.network)
        rootActions.setWallet(validatePassword(wallet, password))
      })
      return initialWelcomeState
    } catch (error) {
      return { ...state, loadAction: { errorMsg: error.message } }
    }
  },

  toggleImportKeys: () => (state) => ({
    ...state,
    createAction: {
      ...state.createAction,
      importKeys: !state.createAction.importKeys,
    },
  }),

  setMyWalletIsSafeVisibile: () => (state) => ({
    ...state,
    createAction: {
      ...state.createAction,
      myWalletIsSafeVisible: !state.createAction.myWalletIsSafeVisible,
    },
  }),

  toggleMyWalletIsSafe: () => (state) => ({
    ...state,
    createAction: {
      ...state.createAction,
      myWalletIsSafe: !state.createAction.myWalletIsSafe,
    },
  }),

  create: ([password, password2, privateKeys, rootState, rootActions]) => (state) => {
    const action = state.createAction
    let result: WelcomeState
    if (!password.equals(password2)) {
      result = {
        ...state,
        createAction: { ...action, errorMsg: 'Passwords does not match' },
      }
    } else if (password.isEmpty()) {
      result = {
        ...state,
        createAction: { ...action, errorMsg: 'Password cannot be empty' },
      }
    } else {
      result = successOf(rootState.info)
        .fmap<WelcomeState>((info) => {
          const wallet = createNewWallet(password, info.network, privateKeys)
          return { ...state, createAction: { ...action, wallet } }
        })
        .valueOr(state)
    }
    return result
  },

  restoreInitialState: () => initialWelcomeState,
}

export const WelcomeView = () => (rootState: State, rootActions: Actions) => {
  const state = rootState.welcome
  const actions = rootActions.welcome

  return state.selected === 'CreateAction' && state.createAction.wallet
    ? newWalletView(state, state.createAction.wallet, actions)
    : actionsView(rootState, rootActions)
}

function actionsView(rootState: State, rootActions: Actions) {
  const actions = rootActions.welcome
  const state = rootState.welcome
  return <div class="pa3">
    <h1>Welcome to the Semux Light!</h1>

    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={state.selected === 'LoadAction'}
          onclick={() => {
            actions.setSelected('LoadAction')
            document.getElementById('load')!.click()
          }}
        />
        {' '}Load wallet from file
    </label>
      <input class="clip" type="file" id="load" />
    </div>

    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={state.selected === 'CreateAction'}
          onclick={() => actions.setSelected('CreateAction')}
        />
        {' '}Create new wallet file
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
        />
      </label>
    </div>

    {state.selected === 'LoadAction' &&
      <div>
        <button
          onclick={() => (
            inputFileById('load')
              .then((walletFile) => actions.load([
                passwordById('password'),
                walletFile,
                rootState,
                rootActions,
              ]))
          )}
        >
          Load wallet
      </button>
        <span class="ml2 dark-red">{state.loadAction.errorMsg}</span>
      </div>
    }

    {state.selected === 'CreateAction' &&
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
            />
          </label>
        </div>

        <div class="mv3">
          <label class="fw7 f6">
            <input
              type="checkbox"
              name="import"
              checked={state.createAction.importKeys}
              onclick={() => {actions.toggleImportKeys()}}
            />
            {' '}Import keys
        </label>
        </div>
        {state.createAction.importKeys &&
          <div class="mv3">
            <label class="fw7 f6">
              Private keys
            <br />
              <textarea
                class="w-100"
                id="privateKeys"
              />
            </label>
          </div>
        }

        <div>
          <button
            onclick={() => actions.create([
              passwordById('password'),
              passwordById('password2'),
              privateKeysOfTextarea('privateKeys'),
              rootState,
              rootActions,
            ])}
          >
            Create new wallet and save the file!
        </button><span class="ml2 dark-red">{state.createAction.errorMsg}</span>
        </div>
      </div>
    }
  </div>
}

function newWalletView(state: WelcomeState, wallet: Wallet, actions: WelcomeActions) {
  return <div class="pa3">
    <div class="mv2">
      <h1>Your new wallet is (almost) ready!</h1>
      <p><b>Remember:</b></p>
      <ul>
        <li>The <b>wallet + password = full access</b> to your funds.</li>
        <li>Keep you wallet and password safe, but <b>not together</b>.</li>
        <li>If your password is easy to guess and wallet easy to get: your funds are not safe.</li>
        <li>Semux Light <b>never</b> sends wallet and/or passwords over the wire. Ever.</li>
      </ul>

      <p>Now, save your{' '}
        <a
          href={walletHref(wallet)} download="semux-wallet.json"
          onclick={() => actions.setMyWalletIsSafeVisibile()}
        >
        semux-wallet.json
        </a>
      </p>
    </div>
    {state.createAction.myWalletIsSafeVisible &&
      <div class="mv2">
        <label>
          <input
            type="checkbox"
            onclick={() => {actions.toggleMyWalletIsSafe()}}
          />
          {' '}Yes, my wallet is safe and I have a backup.
        </label>
      </div>
    }
    {state.createAction.myWalletIsSafe &&
      <div class="mv2">
        <button onclick={() => actions.restoreInitialState()}>
          I am ready to load my new wallet!
        </button>
      </div>
    }
  </div>
}

function passwordById(id: string): Password {
  return new Password((document.getElementById(id) as HTMLInputElement).value)
}

function inputFileById(id: string): Promise<string> {
  return readInputFile(document.getElementById(id) as HTMLInputElement)
}

function privateKeysOfTextarea(id: string): string[] {
  const elem = document.getElementById(id) as HTMLTextAreaElement
  return elem ? elem.value.split(/\s/).map((e) => e.trim()).filter((e) => e) : []
}
