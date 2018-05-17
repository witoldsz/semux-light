import { h, app } from 'hyperapp'
import { State, Actions } from '../app'
import { readJsonInputFile } from '../lib/utils';

export interface WelcomeState {
  action: Action | undefined
}

export const initialWelcomeState: WelcomeState = {
  action: undefined,
}

enum Action {
  Load,
  CreateNew,
  ImportKey,
}

export interface WelcomeActions {
  setAction: (_: Action) => (_: WelcomeState) => WelcomeState
  load: (_: HTMLInputElement) => (_: WelcomeState) => WelcomeState
}

export const rawWelcomeActions: WelcomeActions = {
  setAction: (action) => (state) => ({ ...state, action }),
  load: (inputElem) => (state) => {
    readJsonInputFile(inputElem).then(console.log)
    return { ...state, action: Action.Load }
  },
}

export const WelcomeView = () => (rootState: State, rootActions: Actions) => {
  const state = rootState.welcome
  const actions = rootActions.welcome
  return <div class="pa3">
    <h1>Welcome to the Semux Light!</h1>
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
      <div class="clip22">
        <input type="file" id="load" onchange={(evt) => actions.load(evt.target)}/>
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
