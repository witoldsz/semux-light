import { h } from 'hyperapp'
import { Actions, State } from '../app'
import { sem, transfer } from '../lib/format'
import { Failure, Loading, NotAsked, Success, WebData, caseWebDataOf, isSuccess, successOf } from '../lib/webdata'
import { TransactionType, fetchPendingTxs, fetchTxs } from '../model/transaction'
import { address1st, addresses } from '../model/wallet'

const LIST_SIZE = 200
const FETCH_INTERVAL = 20000

export interface TxsState {
  selectedAddress: string
  pages: { [index: string]: Page }
  fetchTimeoutId: number | undefined
}

interface Transactions {
  pending: TransactionType[],
  completed: TransactionType[],
}

interface Page {
  address: string
  from: number
  to: number
  transactions: WebData<Transactions>
}

function blankPage(address: string): Page {
  return {
    address,
    from: 0,
    to: LIST_SIZE,
    transactions: NotAsked,
  }
}

export const initialTxsState: TxsState = {
  selectedAddress: '',
  pages: {},
  fetchTimeoutId: undefined,
}

function pageOf(state: TxsState, address: string) {
  return state.pages[address] || blankPage(address)
}

export interface TxsActions {
  fetch: (a: { rootState: State, newAddress?: string })
    => (state: TxsState, actions: TxsActions) => TxsState
  cancelNextFetch: () => (s: TxsState) => TxsState
  fetchResult: (a: { page: Page, result: WebData<Transactions> })
    => (state: TxsState) => TxsState
}

export const rawTxsActions: TxsActions = {
  fetch: ({ rootState, newAddress }) => (state, actions) => {
    const address = newAddress || state.selectedAddress || address1st(rootState.wallet)
    if (!address) {
      return state
    }
    const page = pageOf(state, address)
    Promise.all([fetchPendingTxs(address), fetchTxs(address, page.from, page.from + LIST_SIZE)])
      .then(([pending, completed]) => actions.fetchResult({
        page,
        result: Success({ pending, completed }),
      }))
      .catch((error) => actions.fetchResult({ page, result: Failure(error.message) }))

    clearTimeout(state.fetchTimeoutId)
    const fetchTimeoutId = setTimeout(() => actions.fetch({ rootState }), FETCH_INTERVAL)
    return {
      selectedAddress: address,
      fetchTimeoutId,
      pages: {
        ...state.pages,
        [page.address]: {
          ...page,
          transactions: isSuccess(page.transactions) ? page.transactions : Loading,
        },
      },
    }
  },

  cancelNextFetch: () => (state) => {
    clearTimeout(state.fetchTimeoutId)
    return { ...state, fetchTimeoutId: undefined}
  },

  fetchResult: ({ page, result }) => (state) => {
    return {
      ...state,
      pages: {
        ...state.pages,
        [page.address]: {
          ...page,
          to: successOf(result)
            .fmap((txs) => txs.completed.length + page.from)
            .valueOr(page.to),
          transactions: result,
        },
      },
    }
  },
}

export function TransactionsView(rootState: State, rootActions: Actions) {
  const state = rootState.transactions
  const actions = rootActions.transactions
  const page = pageOf(state, state.selectedAddress)
  return <div
    class="pa2"
    key="TransactionsView"
    oncreate={() => actions.fetch({ rootState })}
    ondestroy={() => actions.cancelNextFetch()}
  >
    <div class="mv3 dib">
      <label class="fw7 f6" for="exampleInputName1">Address:</label>{' '}
      <select
        class="f6 h2"
        onchange={(e) => actions.fetch({
          rootState,
          newAddress: e.target.value,
        })}
      >
        {
          addresses(rootState.wallet).map((myAddress) => (
            <option selected={state.selectedAddress === myAddress} value={myAddress}>
              {myAddress}
            </option>
          ))
        }
      </select>
    </div>
    {
      caseWebDataOf(page.transactions, {
        notAsked: () => <span />,
        loading: () => <span>Loading…</span>,
        failure: (error) => <span class="dark-red">{error}</span>,
        success: (txs) => table(page, txs),
      })
    }

  </div>
}

function table(page: Page, txs: Transactions) {
  return <div class="">
    <table class="f6 mw8" cellspacing="0">
      <thead>
        <tr>
          <th class="fw6 bb b--black-20 tl pb1 pl2 pr2">#</th>
          <th class="fw6 bb b--black-20 tl pb1 pl2 pr2">Type</th>
          <th class="fw6 bb b--black-20 tl pb1 pl2 pr2 tc">From/To</th>
          <th class="fw6 bb b--black-20 tl pb1 pl2 pr2 tr">Value</th>
          <th class="fw6 bb b--black-20 tl pb1 pl2 pr2">Time</th>
          <th class="fw6 bb b--black-20 tl pb1 pl2 pr2">Status</th>
        </tr>
      </thead>
      <tbody class="lh-copy">
        {txs.pending.map((tx, idx) => tableRow(tx, 'Pending', page.to + txs.pending.length - idx))}
        {txs.completed.map((tx, idx) => tableRow(tx, 'Completed', page.to - idx))}
      </tbody>
    </table>
  </div>
}

function tableRow(tx: TransactionType, status: string, ordinal: number) {
  return <tr class="hover-bg-washed-blue">
    <td class="pv1 pl2 pr2 bb bl b--black-20">{ordinal}</td>
    <td class="pv1 pl2 pr2 bb bl b--black-20">{tx.type}</td>
    <td class="pv1 pl2 pr2 bb bl b--black-20">
      {transfer(tx.from, tx.to)}
    </td>
    <td class="pv1 pl2 pr2 bb bl b--black-20 tr">{sem(tx.value, false)}</td>
    <td class="pv1 pl2 pr2 bb bl b--black-20">{tx.timestamp.toLocaleString()}</td>
    <td class="pv1 pl2 pr2 bb bl br b--black-20">{status}</td>
  </tr>
}
