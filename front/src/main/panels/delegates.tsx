import { h } from 'hyperapp'
import { DelegateType, fetchDelegates } from '../model/delegate'
import { fetchVotes, AccountVoteType } from '../model/vote'
import { State, Actions } from '../app'
import { addressAbbr, sem } from '../model/wallet'
import BigNumber from 'bignumber.js'
import { locationAddrs, locationAddr1st } from '../lib/location'
import { ZERO } from '../lib/utils'
import { Either } from 'tsmonad'

type MyAddress = string
type DelegateAddress = string
type Votes = Map<MyAddress, Map<DelegateAddress, BigNumber>>

export interface DelegatesState {
  myAddress: MyAddress
  errorMessage: string
  names: Map<DelegateAddress, string>
  votes: Votes
  list: DelegateType[]
}

export const blankDelegates: DelegatesState = {
  myAddress: '',
  errorMessage: '',
  names: new Map(),
  votes: new Map(),
  list: [],
}

export interface DelegatesActions {
  myAddress: (a: string) => (state: DelegatesState) => DelegatesState
  fetch: (rs: State) => (state: DelegatesState, actions: DelegatesActions) => DelegatesState
  fetchResultDelegates: (r: DelegateType[]) => (state: DelegatesState) => DelegatesState
  fetchResultVotes: (a: { myAddress: MyAddress, list: AccountVoteType[] }) => (state: DelegatesState) => DelegatesState
  fetchError: (error) => (state: DelegatesState) => DelegatesState
}

export const rawDelegatesActions: DelegatesActions = {
  myAddress: (myAddress) => (state) =>  ({ ...state, myAddress }),
  fetch: (rootState) => (state, actions) => {
    fetchDelegates()
      .then(actions.fetchResultDelegates)
      .catch(actions.fetchError)

    locationAddrs(rootState.location).forEach((myAddress) => {
      fetchVotes(myAddress)
        .then((list) => actions.fetchResultVotes({ myAddress, list }))
        .catch(actions.fetchError)
    })
    const myAddress = state.myAddress || locationAddr1st(rootState.location) || ''
    return { ...state, myAddress, errorMessage: '' }
  },
  fetchResultDelegates: (list) => (state) => ({
    ...state,
    names: list.reduce((names, d) => names.set(d.address, d.name), new Map<string, string>()),
    list,
  })
  ,
  fetchResultVotes: ({ myAddress, list }) => (state) => ({
    ...state,
    votes: state.votes.set(myAddress, list.reduce(
      (accVotes, v) => accVotes.set(v.delegate, v.votes),
      new Map<DelegateAddress, BigNumber>(),
    )),
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
    <div class="mv3 dib">
      <label class="fw7 f6" for="exampleInputName1">Address:</label>{' '}
      <select
        class="f6 h2 bg-white ma1 b--black-20"
        onchange={(e) => actions.myAddress(e.target.value)}
      >
        {
          locationAddrs(rootState.location).map((myAddress) => (
            <option selected={state.myAddress === myAddress} value={myAddress}>
              {myAddress}
            </option>
          ))
        }
      </select>
    </div>
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
                {sem(myVotesForDelegate(state, d.address), false)}
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

function myVotesForDelegate(state: DelegatesState, delegate: DelegateAddress) {
  const myVotesMap = state.votes.get(state.myAddress)
  const myVotes = myVotesMap && myVotesMap.get(delegate)
  return myVotes ? myVotes : ZERO
}
