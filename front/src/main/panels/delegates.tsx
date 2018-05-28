import BigNumber from 'bignumber.js'
import { Buffer } from 'buffer'
import { h } from 'hyperapp'
import * as Long from 'long'
import semux from 'semux'
import { Actions, State } from '../app'
import { addressAbbr, sem, semNoLabel } from '../lib/format'
import { ZERO, concat, hexBytes } from '../lib/utils'
import {
  Failure, Loading, NotAsked, Success, WebData, caseWebDataOf, failureOf, fmapSuccess, isLoading, isSuccess, successOf,
} from '../lib/webdata'
import { AccountType, fetchAccount } from '../model/account'
import { DelegateType, fetchDelegates } from '../model/delegate'
import { publishTx } from '../model/transaction'
import { AccountVoteType, fetchVotes } from '../model/vote'
import { addresses, getKey } from '../model/wallet'

const FETCH_INTERVAL = 20000

interface RemoteDataResponse {
  accounts: AccountType[]
  myVotesArray: AccountVoteType[]
  delegates: DelegateType[]
}

interface RemoteData {
  accounts: AccountType[]
  delegates: DelegateType[]
  myVotes: Map<string, BigNumber>
  names: Map<string, string>
}

export interface DelegatesState {
  remoteData: WebData<RemoteData>
  fetchTimeoutId: number | undefined
  selectedAccountIdx: number
  voteAmount: BigNumber | undefined
  selectedDelegate: string
  voteResult: WebData<undefined>
}

export const blankDelegates: DelegatesState = {
  remoteData: NotAsked,
  fetchTimeoutId: undefined,
  selectedAccountIdx: 0,
  voteAmount: undefined,
  selectedDelegate: '',
  voteResult: NotAsked,
}

export interface DelegatesActions {
  fetch: (rs: State) => (state: DelegatesState, actions: DelegatesActions) => DelegatesState
  cancelNextFetch: () => (s: DelegatesState) => DelegatesState
  fetchResponse: (r: WebData<RemoteDataResponse>) => (state: DelegatesState) => DelegatesState
  selectedAccountIdx: (n: number) => (state: DelegatesState) => DelegatesState
  selectDelegate: (d: string) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
  voteAmount: (a: BigNumber | string) => (s: DelegatesState) => DelegatesState
  vote: (s: { rootState: State, type: 'VOTE' | 'UNVOTE' }) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
  voteResult: (w: WebData<undefined>) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
}

export const rawDelegatesActions: DelegatesActions = {
  fetch: (rootState) => (state, actions) => {
    Promise
      .all([
        Promise.all(addresses(rootState.wallet).map(fetchAccount)),
        Promise.all(addresses(rootState.wallet).map(fetchVotes)),
        fetchDelegates(),
      ])
      .then(([accounts, myVotes_, delegates]) => actions.fetchResponse(Success({
        accounts,
        myVotesArray: concat(myVotes_),
        delegates,
      })))
      .catch((err) => actions.fetchResponse(Failure(err.message)))

    return {
      ...state,
      fetchTimeoutId: setTimeout(() => actions.fetch(rootState), FETCH_INTERVAL),
      remoteData: isSuccess(state.remoteData) ? state.remoteData : Loading,
    }
  },

  cancelNextFetch: () => (state) => {
    clearTimeout(state.fetchTimeoutId)
    return { ...state, fetchTimeoutId: undefined}
  },

  fetchResponse: ((remoteDataResponse) => (state) => ({
    ...state,
    remoteData: fmapSuccess(remoteDataResponse, ({ accounts, myVotesArray, delegates }) => ({
      accounts,
      delegates,
      myVotes: myVotesArray.reduce(
        (map, { address, delegate, votes }) => map.set(myVotesKey(address, delegate), votes),
        new Map<string, BigNumber>(),
      ),
      names: delegates.reduce(
        (names, d) => names.set(d.address, d.name),
        new Map<string, string>()),
    })),
  })),

  selectedAccountIdx: (selectedAccountIdx) => (state) => ({ ...state, selectedAccountIdx }),

  selectDelegate: (selectedDelegate) => (state, actions) => ({ ...state, selectedDelegate }),

  voteAmount: (val) => (state) => ({ ...state, voteAmount: val ? new BigNumber(val) : undefined }),

  vote: ({ rootState, type }) => (state, actions) => {
    const key = getKey(rootState.wallet, state.selectedAccountIdx)
    const voteAmount = state.voteAmount ||
      successOf(state.remoteData)
        .fmap(({ accounts }) => accounts[state.selectedAccountIdx].available)
        .valueOr(ZERO)

    if (voteAmount.isPositive()) {
      successOf(rootState.info).fmap((info) => {
        fetchAccount(key.toAddressHexString())
          .then((account) => publishTx(new semux.Transaction(
            semux.Network[info.network],
            semux.TransactionType[type],
            hexBytes(state.selectedDelegate),
            Long.fromString(voteAmount.times(1e9).toString()),
            Long.fromString('5000000'),
            Long.fromNumber(account.nonce),
            Long.fromNumber(Date.now()),
            Buffer.from(''),
          ).sign(key)))
          .then(() => actions.voteResult(Success(undefined)))
          .catch((e) => actions.voteResult(Failure(e.message)))
      })
      return { ...state, voteSubmit: Loading }
    } else {
      return { ...state, voteSubmit: NotAsked }
    }
  },

  voteResult: (voteResult) => (state, actions) => {
    setTimeout(() => actions.voteResult(NotAsked), 4000)
    return { ...state, voteResult }
  },
}

export function DelegatesView(rootState: State, rootActions: Actions) {
  const state = rootState.delegates
  const actions = rootActions.delegates
  return <div
    class="pa2"
    oncreate={() => actions.fetch(rootState)}
    ondestroy={() => actions.cancelNextFetch()}
  >
    {caseWebDataOf(state.remoteData, {
      notAsked: () => <div />,
      loading: () => <div>Loading…</div>,
      success: (remoteData) => <div>
        {voteForm(rootState, remoteData, state, actions)}
        {table(remoteData, state, actions)}
      </div>,
      failure: (message) => <div class="dark-red">{message}</div>,
    })}
  </div>
}

function voteForm(rootState: State, remoteData: RemoteData, state: DelegatesState, actions: DelegatesActions) {
  const disabled = !state.selectedDelegate || isLoading(state.voteResult) || isSuccess(state.voteResult)
  return <table class="mv3 dib lh-copy">
    <tr>
      <td class="tr"><label class="fw7 f6">Address:</label></td>
      <td>
        <select
          class="f6 h2"
          onchange={(e) => actions.selectedAccountIdx(parseInt(e.target.value, 10))}
        >
          {
            remoteData.accounts.map((acc, idx) => (
              <option selected={remoteData.accounts.indexOf(acc) === state.selectedAccountIdx} value={idx}>
                {acc.address}, {sem(acc.available)}
              </option>
            ))
          }
        </select>
      </td>
    </tr>
    <tr>
      <td class="tr"><label class="fw7 f6">Selected:</label></td>
      <td>{delegateAbbr(remoteData.delegates, state.selectedDelegate)}</td>
    </tr>
    <tr>
      <td class="tr"><label class="fw7 f6">Action:</label></td>
      <td>
        <input
          type="text"
          value={state.voteAmount ? state.voteAmount.toString() : undefined}
          oninput={(evt) => actions.voteAmount(evt.target.value)}
          placeholder={remoteData.accounts[state.selectedAccountIdx].available.toString()}
          disabled={disabled}
        />
        <button
          disabled={disabled}
          onclick={() => actions.vote({ rootState, type: 'VOTE' })}
        >
          Vote
        </button>
        <button
          disabled={disabled}
          onclick={() => actions.vote({ rootState, type: 'UNVOTE' })}
        >
          Unvote
        </button>
        <span class="dark-red">{failureOf(state.voteResult)}</span>
        <span class="green">{isSuccess(state.voteResult) ? 'OK' : ''}</span>
      </td>
    </tr>
  </table>
}

function table(remoteData: RemoteData, state: DelegatesState, actions: DelegatesActions) {
  return <div class="">
    <table class="f6 mw8" cellspacing="0">
      <thead>
        <tr>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2">Rank</th>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2">Name</th>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2">Address</th>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2 tr">Votes</th>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2 tr">Votes from Me</th>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2">Status</th>
          <th class="fw6 bb b--black-20 tl pb1 pr2 pl2 tr">Rate</th>
        </tr>
      </thead>
      <tbody class="lh-copy">
        {
          remoteData.delegates.map((delegate) => {
            const myVotes = myVotesForDelegate(remoteData, state, delegate.address)
            const selected = delegate.address === state.selectedDelegate
            return <tr
              class={`${selected ? 'bg-lightest-blue ' : 'hover-bg-washed-blue'} pointer`}
              onclick={() => actions.selectDelegate(delegate.address)}
            >
              <td class="pv1 pr2 pl2 bb bl b--black-20">{delegate.rank}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">{delegate.name}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">{addressAbbr(delegate.address)}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20 tr">
                {semNoLabel(delegate.votes)}
              </td>
              <td
                class={`pv1 pr2 pl2 bb bl b--black-20 tr ${myVotes.gt(0) ? 'underline' : ''}`}
                onclick={() => myVotes.gt(0) && actions.voteAmount(myVotes)}
              >
                {semNoLabel(myVotes)}
              </td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">
                {delegate.validator ? 'Validator' : 'Delegate'}
              </td>
              <td class="pv1 pr2 pl2 bb bl br b--black-20 tr">{delegate.rate.toFixed(1)} %</td>
            </tr>
          })
        }
      </tbody>
    </table>
  </div>
}

function myVotesKey(myAddress: string, delegate: string): string {
  return myAddress + delegate
}

function myVotesForDelegate(r: RemoteData, state: DelegatesState, delegate: string): BigNumber {
  const myAddress = r.accounts[state.selectedAccountIdx].address
  return r.myVotes.get(myVotesKey(myAddress, delegate)) || ZERO
}

function delegateAbbr(list: DelegateType[], selectedDelegate) {
  const s = list.find((d) => d.address === selectedDelegate)
  return s ? `${s.name} (${addressAbbr(s.address)})` : ''
}
