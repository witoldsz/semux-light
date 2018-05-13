import { h } from 'hyperapp'
import { Buffer } from 'buffer'
import BigNumber from 'bignumber.js'
import { State, Actions } from '../app'
import { WebData, isLoading, isError, errorOf } from '../lib/webdata'
import semux from 'semux'
import * as Long from 'long'
import { hexBytes, log, isRight } from '../lib/utils'
import { Either } from 'tsmonad'
import { publishTx } from '../model/transaction'
import { fetchAccount, AccountType } from '../model/account'

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
  to: (val: string) => (s: SendState) => SendState
  amount: (val: string) => (s: SendState) => SendState
  data: (val: string) => (s: SendState) => SendState
  privateKey: (val: string) => (s: SendState) => SendState
  submit: (s: State) => (s: SendState, a: SendActions) => SendState
  submitResponse: (r: WebData<undefined>) => (s: SendState) => SendState
}

export const rawSendActions: SendActions = {
  to: (to) => (state) => ({ ...state, to }),
  amount: (amount) => (state) => ({
    ...state,
    amount: Long.fromString(amount).multiply(1e9),
  }),
  data: (data) => (state) => ({ ...state, data }),
  privateKey: (privateKey) => (state) => {
    try {
      const key = semux.Key.importEncodedPrivateKey(hexBytes(privateKey))
      const from = key ? `0x${key.toAddressHexString()}` : ''
      return { ...state, privateKey, from }
    } catch (err) {
      return { ...state, privateKey, from: '' }
    }
  },
  submit: (rootState) => (state, actions) => {
    const key = semux.Key.importEncodedPrivateKey(hexBytes(state.privateKey))
    fetchAccount(state.from)
      .then((account) => publishTx(new semux.Transaction(
          semux.Network.TESTNET,
          semux.TransactionType.TRANSFER,
          hexBytes(state.to),
          state.amount,
          Long.fromString('5000000'),
          Long.fromNumber(account.nonce - 1),
          Long.fromNumber(Date.now()),
          Buffer.from(state.data, 'utf-8'),
        ).sign(key)))
      .then(() => actions.submitResponse('NotAsked'))
      .catch((e) => actions.submitResponse(Either.left(e.message)))

    return {
      ...state,
      submit: 'Loading',
    }
  },
  submitResponse: (response) => (state) => {
    return { ...state, submit: response }
  },
}

export const SendView = (rootState: State, rootActions: Actions) => {
  const a = rootActions.send
  const s = rootState.send
  const inProgress = isLoading(s.submit)
  return <div class="pa2">
    <form>
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
      <div class="mv3">
        <label class="fw7 f6" for="fromInput">From</label>
        <input
          disabled={true}
          type="text"
          class="db w-100 pa2 br2 b--black-20 ba f6"
          id="fromInput"
          placeholder="0x…"
          value={s.from}
          // oninput={(evt) => a.from(evt.target.value)}
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
