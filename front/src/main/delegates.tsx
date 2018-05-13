import { h } from 'hyperapp'
import { DelegateType, fetchDelegates } from './model/delegate'
import { fetchVotes, AccountVoteType } from './model/vote'
import { State, Actions } from './app'
import { addressAbbr, sem } from './model/wallet'
import BigNumber from 'bignumber.js'
import { locationAddrs } from './lib/location'
import { ZERO } from './lib/utils'
import { Either } from 'tsmonad'

export interface DelegatesState {
  errorMessage: string
  names: Map<string, string>
  votes: Map<string, BigNumber>
  list: DelegateType[]
}

export const blankDelegates: DelegatesState = {
  errorMessage: '',
  names: new Map(),
  votes: new Map(),
  list: [],
}

export interface DelegatesActions {
  fetch: (rs: State) => (state: DelegatesState, actions: DelegatesActions) => DelegatesState
  fetchResultDelegates: (r: DelegateType[]) => (state: DelegatesState) => DelegatesState
  fetchResultVotes: (r: AccountVoteType[]) => (state: DelegatesState) => DelegatesState
  fetchError: (error) => (state: DelegatesState) => DelegatesState
}

export const rawDelegatesActions: DelegatesActions = {
  fetch: (rootState) => (state, actions) => {
    fetchDelegates()
      .then(actions.fetchResultDelegates)
      .catch(actions.fetchError)

    locationAddrs(rootState.location).forEach((address) => {
      fetchVotes(address)
        .then(actions.fetchResultVotes)
        .catch(actions.fetchError)
    })
    return { ...state, errorMessage: '' }
  },
  fetchResultDelegates: (list) => (state) => ({
    ...state,
    names: list.reduce((names, d) => names.set(d.address, d.name), new Map<string, string>()),
    list,
  })
  ,
  fetchResultVotes: (list) => (state) => ({
    ...state,
    votes: list.reduce((votes, v) => votes.set(v.delegate, v.votes), new Map<string, BigNumber>()),
  }),
  fetchError: (error) => (state) => ({
    ...state,
    errorMessage: error.message,
  }),
}

export function DelegatesView(rootState: State, rootActions: Actions) {
  const state = rootState.delegates
  const actions = rootActions.delegates
  return <div class="pa2" oncreate={() => actions.fetch(rootState)}>
    {state.errorMessage
      ? <span class="dark-red">{state.errorMessage}</span>
      : table(state)
    }
  </div>
}

function table(state: DelegatesState) {
  return <div class="overflow-auto">
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
          state.list.map((d, i) => (
            <tr class="hover-bg-washed-blue">
              <td class="pv1 pr2 pl2 bb bl b--black-20">{i}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">{d.name}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">{addressAbbr(d.address)}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20 tr">{sem(d.votes, false)}</td>
              <td class="pv1 pr2 pl2 bb bl b--black-20 tr">
                {sem(state.votes.get(d.address) || ZERO, false)}
              </td>
              <td class="pv1 pr2 pl2 bb bl b--black-20">
                {d.validator ? 'Validator' : 'Delegate'}
              </td>
              <td class="pv1 pr2 pl2 bb bl br b--black-20 tr">{d.rate.toFixed(1)} %</td>
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
}
