import { h } from 'hyperapp'
import { WebData, isNotAsked, caseWebDataOf } from './lib/webdata'
import Transaction from 'semux/dist/types/lib/Transaction'
import { State, Actions } from './app'
import { locationAddr1st, LocationState, locationAddrs } from './lib/location'
import { TransactionType, TransactionTypeRes } from './model/transaction'
import { Either } from 'tsmonad/lib/src'
import { fetchTxs } from './model/transaction'
import { log } from './lib/utils'
import { addressAbbr, sem } from './model/wallet'
import { Nav } from './nav'

const LIST_SIZE = 100

export interface TxsState {
  selectedAddress: string
  pages: Page[]
}

interface Page {
  address: string
  from: number
  to: number
  transactions: WebData<TransactionType[]>
}

function blankPage(address: string): Page {
  return {
    address,
    from: 0,
    to: LIST_SIZE,
    transactions: 'NotAsked',
  }
}

export const initialTxsState: TxsState = {
  selectedAddress: '',
  pages: [],
}

function pageOf(state: TxsState, address: string) {
  return state.pages.find((p) => p.address === address) || blankPage(address)
}

function replacePage(pages: Page[], page: Page): Page[] {
  return pages.map((p) => p.address === page.address ? page : p)
}

export interface TxsActions {
  fetch: (a: { locationState: LocationState, newAddress?: string })
    => (state: TxsState, actions: TxsActions) => TxsState
  fetchResult: ({ page, result }: { page: Page, result: TransactionTypeRes }) => (state: TxsState) => TxsState
}

export const rawTxsActions: TxsActions = {
  fetch: ({ locationState, newAddress }) => (state, actions) => {
    if (locationState.route !== Nav.Transactions) {
      return state
    }
    const address = newAddress || state.selectedAddress || locationAddr1st(locationState)
    if (!address) {
      return state
    }
    const page = pageOf(state, address)
    fetchTxs(address, page.from, page.to).then((result) => {
      actions.fetchResult({ page, result })
    })
    return {
      selectedAddress: address,
      pages: replacePage(
        state.pages,
        {
          ...page,
          transactions: isNotAsked(page.transactions) ? 'Loading' : page.transactions,
        },
      ),
    }
  },
  fetchResult: ({ page, result }) => (state) => {
    return {
      ...state,
      pages: [
        ...state.pages,
        {
          ...page,
          to: result.caseOf({
            left: () => page.to,
            right: (txs) => page.from + txs.length,
          }),
          transactions: result,
        },
      ],
    }
  },
}

export function TransactionsView(rootState: State, rootActions: Actions) {
  const state = rootState.transactions
  const actions = rootActions.transactions
  const address = state.selectedAddress
  const page = pageOf(state, address)
  return <div class="pa2">
    <fieldset class="bn">
      <legend class="fw7">Account:</legend>
      {
        locationAddrs(rootState.location).map((addr) => (
          <div class="flex items-center">
            <input
              name="addresses"
              class="mr2"
              type="radio"
              id={`addr_${addr}`}
              value="acc2"
              checked={addr === address}
              onclick={(() => {
                actions.fetch({
                  locationState: rootState.location,
                  newAddress: addr,
                })
              })}
            />
            <label for={`addr_${addr}`} class="lh-copy">{addr}</label>
          </div>
        ))
      }
    </fieldset>

    <div class="overflow-auto">
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
        {
          caseWebDataOf(page.transactions, {
            notAsked: () => <span />,
            loading: () => <span>Loading…</span>,
            failure: (err) => <pre>{err}</pre>,
            success: (rows) => transactionRows(page, rows),
          })
        }
      </table>
    </div>
  </div>
}

function transactionRows(page: Page, rows: TransactionType[]) {
  return <tbody class="lh-copy">
    {rows.map((tx, idx) => (
      <tr class="hover-bg-washed-blue">
        <td class="pv1 pl2 pr2 bb bl b--black-20">{page.to - idx}</td>
        <td class="pv1 pl2 pr2 bb bl b--black-20">{tx.type}</td>
        <td class="pv1 pl2 pr2 bb bl b--black-20">
          {addressAbbr(tx.from)} → {addressAbbr(tx.to)}
        </td>
        <td class="pv1 pl2 pr2 bb bl b--black-20 tr">{sem(tx.value, false)}</td>
        <td class="pv1 pl2 pr2 bb bl b--black-20">{tx.timestamp.toLocaleString()}</td>
        <td class="pv1 pl2 pr2 bb bl br b--black-20">Completed</td>
      </tr>
    ))}
  </tbody>
}
