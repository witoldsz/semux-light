import { h } from 'hyperapp'
import { Buffer } from 'buffer'
import BigNumber from 'bignumber.js'
import { State, Actions } from '../app'
import { WebData, isLoading, isError, errorOf, successOf } from '../lib/webdata'
import semux from 'semux'
import * as Long from 'long'
import { hexBytes, log } from '../lib/utils'
import { Either } from 'tsmonad'
import { publishTx } from '../model/transaction'
import { fetchAccount, AccountType } from '../model/account'
import { accounts, Account, addresses, getKey } from '../model/wallet'
import { sem } from '../lib/format'

export interface SendState {
  fetchAccountsError: string
  accounts: AccountType[]
  selectedAccountIdx: number
  to: string
  amount: Long
  data: string
  submit: WebData<any>
}

export const initialSendState: SendState = {
  fetchAccountsError: '',
  accounts: [],
  selectedAccountIdx: 0,
  to: '',
  amount: Long.ZERO,
  data: '',
  submit: 'NotAsked',
}

export interface SendActions {
  fetchAccounts: (s: State) => (s: SendState, a: SendActions) => void
  fetchAccountsResponse: (as: Either<string, AccountType[]>) => (s: SendState) => SendState
  from: (val: number) => (s: SendState) => SendState
  to: (val: string) => (s: SendState) => SendState
  amount: (val: string) => (s: SendState) => SendState
  data: (val: string) => (s: SendState) => SendState
  submit: (s: State) => (s: SendState, a: SendActions) => SendState
  submitResponse: (r: WebData<undefined>) => (s: SendState) => SendState
}

export const rawSendActions: SendActions = {

  fetchAccounts: (rootState) => (state, actions) => {
    Promise.all(addresses(rootState.wallet).map(fetchAccount))
      .then((accounts) => actions.fetchAccountsResponse(Either.right(accounts)))
      .catch((err) => actions.fetchAccountsResponse(Either.left(err.message)))
  },

  fetchAccountsResponse: (accountsE) => (state) => {
    return accountsE.caseOf({
      left: (message) => ({ ...state, fetchAccountsError: message }),
      right: (accounts) => ({ ...state, accounts }),
    })
  },

  from: (idx) => (state) => ({ ...state, selectedAccountIdx: idx }),

  to: (to) => (state) => ({ ...state, to }),
  amount: (amount) => (state) => ({
    ...state,
    amount: Long.fromString(amount).multiply(1e9),
  }),

  data: (data) => (state) => ({ ...state, data }),
  // privateKey: (privateKey) => (state) => {
  //   try {
  //     const key = semux.Key.importEncodedPrivateKey(hexBytes(privateKey))
  //     const from = key ? `0x${key.toAddressHexString()}` : ''
  //     return { ...state, privateKey, from }
  //   } catch (err) {
  //     return { ...state, privateKey, from: '' }
  //   }
  // },

  submit: (rootState) => (state, actions) => {
    const key = getKey(rootState.wallet, state.selectedAccountIdx)
    const network = successOf(rootState.info).fmap((info) => {
      fetchAccount(key.toAddressHexString())
        .then((account) => publishTx(new semux.Transaction(
          semux.Network[info.network],
          semux.TransactionType.TRANSFER,
          hexBytes(state.to),
          state.amount,
          Long.fromString('5000000'),
          Long.fromNumber(account.nonce),
          Long.fromNumber(Date.now()),
          Buffer.from(state.data, 'utf-8'),
        ).sign(key)))
        .then(() => actions.submitResponse('NotAsked'))
        .catch((e) => actions.submitResponse(Either.left(e.message)))
    })

    return {
      ...state,
      submit: 'Loading',
    }
  },
  submitResponse: (response) => (state) => {
    return { ...state, submit: response }
  },
}

export function SendView(rootState: State, rootActions: Actions) {
  const actions = rootActions.send
  const state = rootState.send
  const inProgress = isLoading(state.submit)
  return <div
    class="pa2"
    key="SendView"
    oncreate={() => actions.fetchAccounts(rootState)}
  >
    <form>

      <div class="mv3">
        <label class="fw7 f6">
          From
          <br />
          <select
            class="f6 h2"
            onchange={(e) => { actions.from(parseInt(e.target.value, 10)) }}
          >
            {
              state.accounts.map((acc, idx) => (
                <option selected={state.accounts.indexOf(acc) === state.selectedAccountIdx} value={idx}>
                  {acc.address}, {sem(acc.available)}
                </option>
              ))
            }
          </select>
        </label>
      </div>

      <div class="mv3">
        <label class="fw7 f6" for="toInput">To</label>
        <input
          disabled={inProgress}
          type="text"
          class="db w-100 pa2 br2 b--black-20 ba f6"
          id="toInput"
          placeholder="0x…"
          oninput={(evt) => actions.to(evt.target.value)}
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
          oninput={(evt) => actions.amount(evt.target.value)}
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="dataInput">Data</label>
        <input
          disabled={inProgress}
          id="dataInput"
          type="text"
          class="db w-100 pa2 br2 b--black-20 ba f6"
          placeholder="Text (UTF-8)"
          oninput={(evt) => actions.data(evt.target.value.trim())}
        />
      </div>
      <button
        onclick={(evt) => { actions.submit(rootState) }}
        disabled={inProgress}
        class="pointer br2 ba b--black-20 bg-white pa2 mv1 bg-animate hover-bg-light-gray f6"
      >
        Send
      </button>
      {' '}
      {isError(state.submit) ? <span class="dark-red">{errorOf(state.submit)}</span> : undefined}
    </form>
  </div>
}
