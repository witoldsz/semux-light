import { h } from 'hyperapp'
import { Actions, State } from '../app'
import { semNoLabel, transfer } from '../lib/format'
import { Failure, Loading, NotAsked, Success, WebData, caseWebDataOf, isSuccess, successOf } from '../lib/webdata'
import { TransactionType, fetchPendingTxs, fetchTxs } from '../model/transaction'
import { address1st, addresses } from '../model/wallet'
import { maybe } from 'tsmonad'
import { calculateRange, PageRange } from '../lib/pagination'
import { fetchAccount } from '../model/account'

const LIST_SIZE = 200
const FETCH_INTERVAL = 20000

export interface TxsState {
  selectedAddress: string
  pages: { [index: string]: Page }
  fetchTimeoutId: any
}

interface Transactions {
  pending: TransactionType[]
  completed: TransactionType[]
  pageRange: PageRange
}

interface Page {
  address: string
  from: number
  to: number
  pageNumber: number
  transactions: WebData<Transactions>
}

function blankPage(address: string): Page {
  return {
    address,
    from: 0,
    to: LIST_SIZE,
    pageNumber: 0,
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

    async function fetchCompleted() {
      const totalCount = await fetchAccount(address).then((acc) => acc.transactionCount)
      const pageRange = calculateRange({
        totalCount,
        pageSize: LIST_SIZE,
        pageNumber: page.pageNumber,
        dir: 'Desc',
      })
      const completed = await fetchTxs(address, pageRange.from, pageRange.to)
      return { pageRange, completed }
    }

    Promise.all([fetchPendingTxs(address), fetchCompleted()])
      .then(([pending, { pageRange, completed }]) => actions.fetchResult({
        page,
        result: Success({ pending, pageRange, completed }),
      }))
      .catch((error) => actions.fetchResult({ page, result: Failure(error.message) }))

    maybe(state.fetchTimeoutId).lift(clearTimeout)
    return {
      selectedAddress: address,
      fetchTimeoutId: setTimeout(() => actions.fetch({ rootState }), FETCH_INTERVAL),
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
    maybe(state.fetchTimeoutId).lift(clearTimeout)
    return { ...state, fetchTimeoutId: undefined}
  },

  fetchResult: ({ page, result }) => (state) => {
    const newPage = {
      ...page,
      from: successOf(result).fmap((r) => r.pageRange.from).valueOr(page.from),
      to: successOf(result).fmap((r) => r.pageRange.to).valueOr(page.to),
      transactions: result,
    }
    return {
      ...state,
      pages: {
        ...state.pages,
        [page.address]: newPage,
      },
    }
  },
}

export function TransactionsView(rootState: State, rootActions: Actions) {
  const state = rootState.transactions
  const actions = rootActions.transactions
  const page = pageOf(state, state.selectedAddress)
  return <div
    class="pa2 overflow-x-auto"
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
    <td class="pv1 pl2 pr2 bb bl b--black-20 tr">{semNoLabel(tx.value)}</td>
    <td class="pv1 pl2 pr2 bb bl b--black-20">{tx.timestamp.toLocaleString()}</td>
    <td class="pv1 pl2 pr2 bb bl br b--black-20">{status}</td>
  </tr>
}
