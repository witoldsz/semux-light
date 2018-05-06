import { h } from 'hyperapp'
import { Buffer } from 'buffer'
import BigNumber from 'bignumber.js'
import { State, Actions } from './app'
import { WebData, isLoading, isError, errorOf } from './lib/webdata'
import semux from 'semux'
import * as Long from 'long'
import { nonce } from './model/wallet'
import { hexBytes, log, isLeft } from './lib/utils'
import { Either } from 'tsmonad'
import { publishTx } from './model/api'

export interface SendState {
  from: string
  to: string
  amount: Long
  data: string
  privateKey: string
  submit: WebData<any>
}

export const initialSendState: SendState = {
  from: '',
  to: '',
  amount: Long.ZERO,
  data: '',
  privateKey: '',
  submit: 'NotAsked',
}

export interface SendActions {
  from: (val: string) => (s: SendState) => SendState
  to: (val: string) => (s: SendState) => SendState
  amount: (val: string) => (s: SendState) => SendState
  data: (val: string) => (s: SendState) => SendState
  privateKey: (val: string) => (s: SendState) => SendState
  submit: (s: State) => (s: SendState, a: SendActions) => SendState
  submitResponse: (r: Either<string, any>) => (s: SendState) => SendState
}

export const rawSendActions: SendActions = {
  from: (from) => (state) => ({ ...state, from }),
  to: (to) => (state) => ({ ...state, to }),
  amount: (amount) => (state) => ({
    ...state,
    amount: Long.fromString(amount).multiply(1e9),
  }),
  data: (data) => (state) => ({ ...state, data }),
  privateKey: (privateKey) => (state) => ({ ...state, privateKey }),
  submit: (rootState) => (state, actions) => {
    const key = semux.Key.importEncodedPrivateKey(hexBytes(state.privateKey))
    const tx = new semux.Transaction(
      semux.Network.TESTNET,
      semux.TransactionType.TRANSFER,
      hexBytes(state.to),
      state.amount,
      Long.fromString('5000000'),
      nonce(rootState, state.from),
      Long.fromNumber(new Date().getTime()),
      Buffer.from(state.data, 'utf-8'),
    ).sign(key)

    publishTx(tx).then(actions.submitResponse)
    return {
      ...state,
      submit: 'Loading',
    }
  },
  submitResponse: (response) => (state) => {
    return {
      ...state,
      submit: isLeft(response) ? 'NotAsked' : response,
    }
  },
}

export const SendView = (rootState: State, rootActions: Actions) => {
  const a = rootActions.send
  const s = rootState.send
  const inProgress = isLoading(s.submit)
  return <div class="pa2">
    <form>
      <div class="mv3">
        <label class="fw7 f6" for="fromInput">From</label>
        <input
          disabled={inProgress}
          type="text"
          class="db w-100 pa2 br2 b--black-20 ba f6"
          id="fromInput"
          placeholder="0x…"
          oninput={(evt) => a.from(evt.target.value)}
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="toInput">To</label>
        <input
          disabled={inProgress}
          type="text"
          class="db w-100 pa2 br2 b--black-20 ba f6"
          id="toInput"
          placeholder="0x…"
          oninput={(evt) => a.to(evt.target.value)}
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="amountInput">Amount</label>
        <input
          disabled={inProgress}
          id="amountInput"
          type="text"
          class="db pa2 br2 b--black-20 ba f6"
          placeholder="SEM"
          oninput={(evt) => a.amount(evt.target.value)}
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="dataInput">Data</label>
        <input
          disabled={inProgress}
          id="dataInput"
          type="text"
          class="db w-100 pa2 br2 b--black-20 ba f6"
          placeholder="Text"
          oninput={(evt) => a.data(evt.target.value)}
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="privateKeyInput">Private key</label>
        <input
          disabled={inProgress}
          id="privateKeyInput"
          type="password"
          autocomplete="off"
          class="db pa2 w-100 br2 b--black-20 ba f6"
          oninput={(evt) => a.privateKey(evt.target.value)}
        />
      </div>
      <button
        onclick={(evt) => { a.submit(rootState)}}
        disabled={inProgress}
        class="pointer br2 ba b--black-20 bg-white pa2 mv1 bg-animate hover-bg-light-gray f6"
      >
        Send
      </button>
      {' '}
      {isError(s.submit) ? <span class="dark-red">{errorOf(s.submit)}</span> : undefined}
    </form>
  </div>
}
