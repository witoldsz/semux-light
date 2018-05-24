import { h, app } from 'hyperapp'
import { State, Actions } from '../app'
import { readInputFile } from '../lib/utils'
import { WalletState, Wallet, createNewWallet, validateWallet, validatePassword } from '../model/wallet'
import { InfoType } from '../model/info'
import { successOf } from '../lib/webdata'
import semux from 'semux'
import { saveJsonFile } from '../lib/saveFile'
import { Password } from '../lib/password'
import { Either } from 'tsmonad'

export interface WelcomeState {
  action: Action | undefined
  errorMessage: string
  loadMessage: string
  createMessage: string
  walletFile: any
}

type Action = 'Load' | ['CreateNew', boolean]
function isLoad(a: Action | undefined): a is 'Load' {
  return a === 'Load'
}
function isCreateNew(a: Action | undefined): a is ['CreateNew', boolean] {
  return !!a && a[0] === 'CreateNew'
}
function isCreateNewImport(a: Action | undefined) {
  return isCreateNew(a) && a[1]
}

export const initialWelcomeState: WelcomeState = {
  action: undefined,
  errorMessage: '',
  loadMessage: '',
  createMessage: '',
  walletFile: undefined,
}

export interface WelcomeActions {
  setAction: (_: Action) => (s: WelcomeState) => WelcomeState
  setError: (_: any) => (s: WelcomeState) => WelcomeState
  setWalletFileBody: (body: Either<string, any>) => (s: WelcomeState) => WelcomeState
  load: (_: [Password, State, Actions]) => (s: WelcomeState, a: WelcomeActions) => WelcomeState
  create: (_: [Password, Password, State, Actions, string[]]) => (s: WelcomeState) => WelcomeState
}

export const rawWelcomeActions: WelcomeActions = {
  setAction: (action) => (state) => ({ ...state, action }),

  setError: (error = '') => (state) => (
    {
      ...state,
      errorMessage: error.message || error.toString(),
    }
  ),

  setWalletFileBody: (bodyE) => (state) => (
    bodyE.caseOf({
      left: (loadMessage) => ({ ...state, loadMessage }),
      right: (body) => ({ ...state, loadMessage: '', walletFile: body }),
    })
  ),

  load: ([password, rootState, rootActions]) => (state, actions) => {
    try {
      successOf(rootState.info).fmap((info) => {
        const wallet = validateWallet(state.walletFile, info.network)
        rootActions.setWallet(validatePassword(wallet, password))
      })
      return initialWelcomeState
    } catch (error) {
      return { ...state, loadMessage: error.message }
    }
  },

  create: ([password, password2, rootState, rootActions, privateKeys]) => (state) => {
    if (!password.equals(password2)) {
      return { ...state, createMessage: 'Passwords does not match' }
    }
    if (password.isEmpty()) {
      return { ...state, createMessage: 'Password cannot be empty' }
    }
    successOf(rootState.info).fmap((info) => {
      const wallet = createNewWallet(password, info.network, privateKeys)
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
          checked={isLoad(state.action)}
          onclick={() => {
            actions.setAction('Load')
            document.getElementById('load')!.click()
          }}
        />
        {' '}Load wallet from file
      </label>
      <input
          class="clip"
          type="file"
          id="load"
          onchange={(evt) => readInputFile(evt.target)
            .then((body) => actions.setWalletFileBody(Either.right(body)))
            .catch((err) => actions.setWalletFileBody(Either.left(err.message)))
          }
        />
    </div>

    <div class="mv2">
      <label>
        <input
          type="radio"
          name="welcome"
          checked={isCreateNew(state.action)}
          onclick={() => {
            actions.setAction(['CreateNew', false])
          }}
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

    {isLoad(state.action) &&
      <div>
        <button onclick={() => actions.load([passwordById('password'), rootState, rootActions])}>
          Load wallet
        </button>
        <span class="ml2 dark-red">{state.loadMessage}</span>
      </div>
    }

    {isCreateNew(state.action) &&
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
              checked={isCreateNewImport(state.action)}
              onclick={() => {actions.setAction(['CreateNew', !isCreateNewImport(state.action)])}}
            />
            {' '}Import keys
          </label>
        </div>
        {isCreateNewImport(state.action) &&
          <div class="mv3">
            <label class="fw7 f6">
              Private keys
              <br/>
              <textarea
                class="w-100"
                id="privateKeys"
              />
            </label>
          </div>
        }

        <div>
          <button onclick={() => actions.create([
            passwordById('password'),
            passwordById('password2'),
            rootState,
            rootActions,
            privateKeysOfTextarea('privateKeys'),
          ])}>
            Create new wallet and save the file!
          </button><span class="ml2 dark-red">{state.createMessage}</span>
        </div>
      </div>
    }
  </div>
}

function passwordById(id: string): Password {
  return new Password((document.getElementById(id) as HTMLInputElement).value)
}

function privateKeysOfTextarea(id: string): string[] {
  const elem = document.getElementById(id) as HTMLTextAreaElement
  return elem ? elem.value.split(/\s/).map((e) => e.trim()).filter((e) => e) : []
}
