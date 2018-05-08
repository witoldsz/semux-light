import { h } from 'hyperapp'
import { DelegateType, DelegatesResponse, fetchDelegates } from './model/delegate'
import { State, Actions } from './app'
import { addressAbbr, sem } from './model/wallet'

export interface DelegatesState {
  error: string,
  names: Map<string, string>,
  list: DelegateType[]
}

export const blankDelegates: DelegatesState = {
  error: '',
  names: new Map(),
  list: [],
}

export interface DelegatesActions {
  fetch: () => (state: DelegatesState, actions: DelegatesActions) => DelegatesState
  fetchResult: (r: DelegatesResponse) => (state: DelegatesState) => DelegatesState
}

export const rawDelegatesActions: DelegatesActions = {
  fetch: () => (state, actions) => {
    fetchDelegates().then(actions.fetchResult)
    return state
  },
  fetchResult: (listE) => (state) => {
    return listE.caseOf({
      left: (error) => ({ ...blankDelegates, error }),
      right: (list) => ({
        error: '',
        names: list.reduce((names, d) => names.set(d.address, d.name), new Map<string, string>()),
        list,
      }),
    })
  },
}

export function DelegatesView(rootState: State, rootActions: Actions) {
  const state = rootState.delegates
  return <div class="pa2">
    {state.error
      ? <span class="dark-red">{state.error}</span>
      : table(state)
    }
  </div>
}

function table(state: DelegatesState) {
  return <div class="overflow-auto">
    <table class="f6 w-100 mw8" cellspacing="0">
      <thead>
        <tr>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Rank</th>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Name</th>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Address</th>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Votes</th>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Votes from Me</th>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Status</th>
          <th class="fw6 bb b--black-20 tl pb1 pr3">Rate</th>
        </tr>
      </thead>
      <tbody class="lh-copy">
        {
          state.list.map((d, i) => (
            <tr class="hover-bg-washed-blue">
              <td class="pv2 pr3 bb b--black-20">{i}</td>
              <td class="pv2 pr3 bb b--black-20">{d.name}</td>
              <td class="pv2 pr3 bb b--black-20">{addressAbbr(d.address)}</td>
              <td class="pv2 pr3 bb b--black-20">{sem(d.votes, false)}</td>
              <td class="pv2 pr3 bb b--black-20">TODO</td>
              <td class="pv2 pr3 bb b--black-20">Validator</td>
              <td class="pv2 pr3 bb b--black-20">94.1 %</td>
            </tr>
          ))
        }

        <tr class="hover-bg-washed-blue">
          <td class="pv2 pr3 bb b--black-20">2</td>
          <td class="pv2 pr3 bb b--black-20">water</td>
          <td class="pv2 pr3 bb b--black-20">0x7f40c…fe5f</td>
          <td class="pv2 pr3 bb b--black-20">22,000</td>
          <td class="pv2 pr3 bb b--black-20">0</td>
          <td class="pv2 pr3 bb b--black-20">Validator</td>
          <td class="pv2 pr3 bb b--black-20">87.4 %</td>
        </tr>
      </tbody>
    </table>
  </div>
}
