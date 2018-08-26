import BigNumber from 'bignumber.js'
import { Buffer } from 'buffer'
import { h } from 'hyperapp'
import * as Long from 'long'
import { Network, Transaction, TransactionType } from 'semux-js'
import { Actions, State } from '../app'
import { addressAbbr, sem, semNoLabel } from '../lib/format'
import { ZERO, concat, hexBytes } from '../lib/utils'
import {
  Failure, Loading, NotAsked, Success, WebData, caseWebDataOf, failureOf, fmapSuccess, isLoading, isSuccess, successOf,
} from '../lib/webdata'
import { AccountType, fetchAccount } from '../model/account'
import { DelegateType, fetchDelegates } from '../model/delegate'
import { publishTx, TX_FEE_NANO, TX_FEE_SEM } from '../model/transaction'
import { AccountVoteType, fetchVotes } from '../model/vote'
import { addresses, getKey } from '../model/wallet'
import { maybe } from 'tsmonad'

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
  fetchTimeoutId: NodeJS.Timer | undefined
  selectedAccountIdx: number
  voteAmount: string
  selectedDelegate: string
  voteResult: WebData<undefined>
  searchPhrase: string
}

export const initialDelegatesState: DelegatesState = {
  remoteData: NotAsked,
  fetchTimeoutId: undefined,
  selectedAccountIdx: 0,
  voteAmount: '',
  selectedDelegate: '',
  voteResult: NotAsked,
  searchPhrase: '',
}

export interface DelegatesActions {
  fetch: (rs: State) => (state: DelegatesState, actions: DelegatesActions) => DelegatesState
  cancelNextFetch: () => (s: DelegatesState) => DelegatesState
  fetchResponse: (r: WebData<RemoteDataResponse>) => (state: DelegatesState) => DelegatesState
  selectedAccountIdx: (n: number) => (state: DelegatesState) => DelegatesState
  selectDelegate: (d: string) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
  voteAmount: (a: string) => (s: DelegatesState) => DelegatesState
  vote: (s: { rootState: State, type: 'VOTE' | 'UNVOTE' }) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
  voteResultOk: () => (s: DelegatesState) => DelegatesState
  voteResultFailed: (err: string) => (s: DelegatesState) => DelegatesState
  searchInput: (d: string) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
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

    maybe(state.fetchTimeoutId).lift(clearTimeout)
    return {
      ...state,
      fetchTimeoutId: setTimeout(() => actions.fetch(rootState), FETCH_INTERVAL),
      remoteData: isSuccess(state.remoteData) ? state.remoteData : Loading,
    }
  },

  cancelNextFetch: () => (state) => {
    maybe(state.fetchTimeoutId).lift(clearTimeout)
    return { ...state, fetchTimeoutId: undefined }
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

  voteAmount: (voteAmount) => (state) => ({ ...state, voteAmount }),

  vote: ({ rootState, type }) => (state, actions) => {
    const key = getKey(rootState.wallet, state.selectedAccountIdx)
    const amount = voteAmount(state)
    const confirmed = window.confirm(
      `Are you sure you want to ${type.toLowerCase()} ${sem(amount)} for ${addressAbbr(state.selectedDelegate)}?`,
    )
    if (confirmed) {
      successOf(rootState.info).fmap((info) => {
        fetchAccount(key.toAddressHexString())
          .then((account) => publishTx(new Transaction(
            Network[info.network],
            TransactionType[type],
            hexBytes(state.selectedDelegate),
            Long.fromString(amount.times(1e9).toString()),
            TX_FEE_NANO,
            Long.fromNumber(account.nonce),
            Long.fromNumber(Date.now()),
            Buffer.from(''),
          ).sign(key)))
          .then(() => actions.voteResultOk())
          .catch((e) => actions.voteResultFailed(e.message))
      })
      return { ...state, voteResult: Loading }
    } else {
      return state
    }
  },

  voteResultOk: () => (state) => {
    window.alert(`The operation is pending network verification. See "Transactions" tab for status update.`)
    return {
      ...state,
      voteAmount: initialDelegatesState.voteAmount,
      voteResult: Success(undefined),
    }
  },

  voteResultFailed: (err) => (state) => {
    window.alert(err)
    return { ...state, voteResult: Failure(err) }
  },

  searchInput: (searchPhrase) => (state, actions) => ({ ...state, searchPhrase }),
}

export function DelegatesView(rootState: State, rootActions: Actions) {
  const state = rootState.delegates
  const actions = rootActions.delegates
  return <div
    key="DelegatesView"
    class="pa2 overflow-x-auto"
    oncreate={() => actions.fetch(rootState)}
    ondestroy={() => actions.cancelNextFetch()}
  >
    {caseWebDataOf(state.remoteData, {
      notAsked: () => <div/>,
      loading: () => <div>Loading…</div>,
      success: (remoteData) => <div>
        <div class="flex flex-wrap mw7-l mb2">
          {voteForm(rootState, remoteData, state, actions)}
          {searchForm(state, actions)}
        </div>
        {table(remoteData, state, actions)}
      </div>,
      failure: (message) => <div class="dark-red">{message}</div>,
    })}
  </div>
}

function searchForm(state: DelegatesState, actions: DelegatesActions) {
  return <form class={formStyles.form}>
    <div class={`${formStyles.row} pl6-ns`}>
      <label class={formStyles.label} for="account-select">Search delegate:</label>
      <div class={formStyles.field}>
        <input
          type="text"
          value={state.searchPhrase}
          onkeyup={(e) => actions.searchInput(e.target.value)}
          class={formStyles.fieldInput}
          style={{
            flex: 1,
          }}
        />
        <button type="button" onclick={() => actions.searchInput('')}>Clear</button>
      </div>
    </div>
  </form>
}

function voteForm(rootState: State, remoteData: RemoteData, state: DelegatesState, actions: DelegatesActions) {
  const disabled = !state.selectedDelegate || isLoading(state.voteResult)
  const noAmount = !voteAmount(state).gt(0)

  return <form class={formStyles.form}>
    <div class={formStyles.row}>
      <label class={formStyles.label} for="account-select">Address:</label>
      <div class={formStyles.field}>
        <select
          id="account-select"
          class="f6 h2 w-100"
          onchange={(e) => actions.selectedAccountIdx(parseInt(e.target.value, 10))}
        >
          {remoteData.accounts.map((acc, idx) => (
            <option selected={remoteData.accounts.indexOf(acc) === state.selectedAccountIdx} value={idx}>
              {acc.address}, {sem(acc.available)}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div class={formStyles.row}>
      <label class={formStyles.label} for="password">Selected:</label>
      <div class={`${formStyles.field} pt1`}>
        {delegateAbbr(remoteData.delegates, state.selectedDelegate) || '---'}
      </div>
    </div>
    <div class={formStyles.row}>
      <label class={formStyles.label} for="password">Action:</label>
      <div class={formStyles.field}>
        <input
          type="text"
          value={state.voteAmount ? state.voteAmount.toString() : undefined}
          oninput={(evt) => actions.voteAmount(evt.target.value)}
          placeholder={maxVote(state).toString()}
          disabled={disabled}
          class={formStyles.fieldInput}
          style={{
            flex: 1,
          }}
        />
        <button
          type="button"
          disabled={disabled || noAmount}
          onclick={() => actions.vote({ rootState, type: 'VOTE' })}
        >
          Vote
        </button>
        <button
          type="button"
          disabled={disabled || noAmount}
          onclick={() => actions.vote({ rootState, type: 'UNVOTE' })}
        >
          Unvote
        </button>
      </div>
      <div>
        <span class="dark-red">{failureOf(state.voteResult)}</span>
      </div>
    </div>
  </form>
}

function table(remoteData: RemoteData, state: DelegatesState, actions: DelegatesActions) {
  return <div class="w-100 mw7-l">
    <table class="f6 w-100" cellspacing="0">
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
        filterDelegates(remoteData.delegates, state.searchPhrase).map((delegate) => {
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
              onclick={() => myVotes.gt(0) && actions.voteAmount(myVotes.toString())}
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

function filterDelegates(delegates: DelegateType[], searchPhrase: string) {
  return delegates.filter(({ name }) => name.toLowerCase().includes(searchPhrase.toLowerCase()))
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

function maxVote(state: DelegatesState): BigNumber {
  return successOf(state.remoteData)
    .fmap(({ accounts }) => accounts[state.selectedAccountIdx])
    .fmap(({ available }) => BigNumber.max(0, available.minus(TX_FEE_SEM.times(2))))
    .valueOr(ZERO)
}

function voteAmount(state: DelegatesState): BigNumber {
  return state.voteAmount ? new BigNumber(state.voteAmount) : maxVote(state)
}

const formStyles = {
  form: 'w-100',
  row: 'w-100 relative pl5-ns mv1',
  field: 'w-100 h2 flex pl1-ns',
  fieldInput: 'w-100 pa1',
  label: 'dib fw6 f6 static absolute-ns left-0 pt1-ns',
}
