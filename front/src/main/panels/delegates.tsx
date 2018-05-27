import BigNumber from 'bignumber.js'
import { h } from 'hyperapp'
import { Actions, State } from '../app'
import { addressAbbr, semNoLabel } from '../lib/format'
import { ZERO } from '../lib/utils'
import { Loading, NotAsked, WebData } from '../lib/webdata'
import { DelegateType, fetchDelegates } from '../model/delegate'
import { AccountVoteType, fetchVotes } from '../model/vote'
import { address1st, addresses } from '../model/wallet'

export interface DelegatesState {
  myAddress: string
  errorMessage: string
  names: Map<string, string>
  myVotes: Map<string, BigNumber>
  voteAmount: BigNumber
  delegates: DelegateType[]
  selectedDelegate: string
  voteResult: WebData<undefined>
}

export const blankDelegates: DelegatesState = {
  myAddress: '',
  errorMessage: '',
  names: new Map(),
  myVotes: new Map(),
  voteAmount: ZERO,
  delegates: [],
  selectedDelegate: '',
  voteResult: NotAsked,
}

export interface DelegatesActions {
  myAddress: (a: string) => (state: DelegatesState) => DelegatesState
  fetch: (rs: State) => (state: DelegatesState, actions: DelegatesActions) => DelegatesState
  fetchResultDelegates: (r: DelegateType[]) => (state: DelegatesState) => DelegatesState
  fetchResultVotes: (a: { myAddress: string, list: AccountVoteType[] }) => (state: DelegatesState) => DelegatesState
  fetchError: (e: Error) => (state: DelegatesState) => DelegatesState
  selectDelegate: (d: string) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
  voteAmount: (a: BigNumber) => (s: DelegatesState) => DelegatesState
  vote: () => (s: DelegatesState, a: DelegatesActions) => DelegatesState
  voteResult: (w: WebData<undefined>) => (s: DelegatesState, a: DelegatesActions) => DelegatesState
}

export const rawDelegatesActions: DelegatesActions = {
  myAddress: (myAddress) => (state) => ({ ...state, myAddress }),

  fetch: (rootState) => (state, actions) => {
    fetchDelegates()
      .then(actions.fetchResultDelegates)
      .catch(actions.fetchError)

    addresses(rootState.wallet).forEach((myAddress) => {
      fetchVotes(myAddress)
        .then((list) => actions.fetchResultVotes({ myAddress, list }))
        .catch(actions.fetchError)
    })
    const myAddress = state.myAddress || address1st(rootState.wallet) || ''
    return { ...state, myAddress, errorMessage: '' }
  },

  fetchResultDelegates: (delegates) => (state) => ({
    ...state,
    names: delegates.reduce((names, d) => names.set(d.address, d.name), new Map<string, string>()),
    delegates,
  }),

  fetchResultVotes: ({ myAddress, list }) => (state) => ({
    ...state,
    myVotes: list.reduce(
      (map, { delegate, votes }) => map.set(myVotesKey(myAddress, delegate), votes),
      new Map(state.myVotes)),
  }),

  fetchError: (error) => (state) => ({
    ...state,
    errorMessage: error.message,
  }),

  selectDelegate: (selectedDelegate) => (state, actions) => ({ ...state, selectedDelegate }),

  voteAmount: (voteAmount) => (state) => ({ ...state, voteAmount }),

  vote: () => (state, actions) => {
    return { ...state, voteSubmit: Loading }
  },

  voteResult: (voteResult) => (state, actions) => ({ ...state, voteResult }),

}

export function DelegatesView(rootState: State, rootActions: Actions) {
  const state = rootState.delegates
  const actions = rootActions.delegates
  return <div class="pa2" oncreate={() => actions.fetch(rootState)}>
    <table class="mv3 dib lh-copy">
      <tr>
        <td class="tr"><label class="fw7 f6">Address:</label></td>
        <td>
          <select
            class="f6 h2"
            onchange={(e) => actions.myAddress(e.target.value)}
          >
            {
              addresses(rootState.wallet).map((myAddress) => (
                <option selected={state.myAddress === myAddress} value={myAddress}>
                  {myAddress}
                </option>
              ))
            }
          </select>
        </td>
      </tr>
      <tr>
        <td class="tr"><label class="fw7 f6">Selected:</label></td>
        <td>{delegateAbbr(state.delegates, state.selectedDelegate)}</td>
      </tr>
      <tr>
        <td class="tr"><label class="fw7 f6">Action:</label></td>
        <td>
          <input type="text" value={state.voteAmount.toString()} placeholder="SEM" disabled={!state.selectedDelegate} />
          <button disabled={!state.selectedDelegate}>Vote</button>
          <button disabled={!state.selectedDelegate}>Unvote</button></td>
      </tr>
    </table>
    {state.errorMessage
      ? <span class="dark-red">{state.errorMessage}</span>
      : table(state, actions)
    }
  </div>
}

function table(state: DelegatesState, actions: DelegatesActions) {
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
          state.delegates.map((d, i) => {
            const myVotes = myVotesForDelegate(state, d.address)
            const selected = d.address === state.selectedDelegate
            return <tr
              class={`${selected ? 'bg-lightest-blue ' : 'hover-bg-washed-blue'} pointer`}
              onclick={() => actions.selectDelegate(d.address)}
            >
              <td class="pv1 pr2 pl2 bb bl b--black-20">{i}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">{d.name}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">{addressAbbr(d.address)}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20 tr">
                {semNoLabel(d.votes)}
              </td>
              <td
                class={`pv1 pr2 pl2 bb bl b--black-20 tr ${myVotes.gt(0) ? 'underline' : ''}`}
                onclick={() => myVotes.gt(0) && actions.voteAmount(myVotes)}
              >
                {semNoLabel(myVotes)}
              </td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">
                {d.validator ? 'Validator' : 'Delegate'}
              </td>
              <td class="pv1 pr2 pl2 bb bl br b--black-20 tr">{d.rate.toFixed(1)} %</td>
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

function myVotesForDelegate(state: DelegatesState, delegate: string): BigNumber {
  return state.myVotes.get(myVotesKey(state.myAddress, delegate)) || ZERO
}

function delegateAbbr(list: DelegateType[], selectedDelegate) {
  const s = list.find((d) => d.address === selectedDelegate)
  return s ? `${s.name} (${addressAbbr(s.address)})` : ''
}
