import { h } from 'hyperapp'
import { State, Actions } from '../app'
import BigNumber from 'bignumber.js'
import { ZERO, concat, mutableReverse } from '../lib/utils'
import { BlockType, fetchLatestBlock } from '../model/block'
import { AccountType, fetchAccount } from '../model/account'
import { Maybe } from 'tsmonad'
import { fetchLastTxs, TransactionType, caseTypeOf } from '../model/transaction'
import { localeDateTime, transfer, sem, addressAbbr } from '../lib/format'
import { addresses, address1st } from '../model/wallet'

const MAX_TXS_SIZE = 5
const FETCH_INTERVAL = 20000

export interface HomeState {
  errorMessage: string,
  block: Maybe<BlockType>
  accounts: AccountType[]
  transactions: TransactionType[]
  fetchTimeoutId: number | undefined
}

export const initialHomeState: HomeState = {
  errorMessage: '',
  block: Maybe.nothing(),
  accounts: [],
  transactions: [],
  fetchTimeoutId: undefined,
}

type AccountAndTxs = [AccountType, TransactionType[]]
async function fetchAccAndTxs(address: string): Promise<AccountAndTxs> {
  const account = await fetchAccount(address)
  const transactions = await fetchLastTxs(account, { page: 0, size: MAX_TXS_SIZE })
  return [account, transactions]
}

export interface HomeActions {
  fetch: (r: State) => (s: HomeState, a: HomeActions) => HomeState
  cancelNextFetch: () => (s: HomeState) => HomeState
  fetchBlockResponse: (b: BlockType) => (s: HomeState) => HomeState
  fetchAccountsResponse: (a: AccountAndTxs[]) => (s: HomeState) => HomeState
  fetchError: (error) => (s: HomeState) => HomeState
}

export const rawHomeActions: HomeActions = {

  fetch: (rootState) => (state, actions) => {
    fetchLatestBlock()
      .then(actions.fetchBlockResponse)
      .catch(actions.fetchError)

    Promise
      .all(addresses(rootState.wallet).map(fetchAccAndTxs))
      .then(actions.fetchAccountsResponse)
      .catch(actions.fetchError)

    const fetchTimeoutId = setTimeout(() => actions.fetch(rootState), FETCH_INTERVAL)

    return { ...state, fetchTimeoutId, errorMessage: '' }
  },

  cancelNextFetch: () => (state) => {
    clearTimeout(state.fetchTimeoutId)
    return { ...state, fetchTimeoutId: undefined }
  },

  fetchBlockResponse: (block) => (state) => ({
    ...state,
    block: Maybe.just(block),
  }),

  fetchAccountsResponse: (accAndTxsArr) => (state) => {
    const transactions = Array.from(
      concat(accAndTxsArr.map(([_, txs]) => txs))
        .reduce((map, tx) => map.set(tx.hash, tx), new Map<string, TransactionType>())
        .values(),
    )
      .sort((tx1, tx2) => tx2.timestamp.getTime() - tx1.timestamp.getTime())
      .slice(0, MAX_TXS_SIZE)

    return {
      ...state,
      accounts: accAndTxsArr.map(([acc, _]) => acc),
      transactions,
    }
  },

  fetchError: (error) => (state) => ({
    ...state,
    errorMessage: error.message,
  }),
}

export function HomeView(rootState: State, rootActions: Actions) {
  const state = rootState.home
  const actions = rootActions.home
  return <div
    class="pa2"
    key="HomeView"
    oncreate={() => actions.fetch(rootState)}
    ondestroy={() => actions.cancelNextFetch()}
  >
    {state.errorMessage
      ? <div class="dark-red pb3">{state.errorMessage}</div>
      : ''
    }
    <div class="flex">
      <div class="mw5 mw6-ns hidden ba">
        <h1 class="f5 bg-near-black white mv0 pv2 ph3">Overview</h1>
        <table class="pa3 f6">
          <tr>
            <td class="b lh-title pv1">Block #:</td>
            <td>
              {state.block.map((b) => b.number.toLocaleString()).valueOr('')}
            </td>
          </tr>
          <tr>
            <td class="b lh-title pv1">Block time:</td>{' '}
            <td>{
              state.block.map(({ timestamp: d }) => localeDateTime(d)).valueOr('')
              }
            </td>
          </tr>
          <tr>
            <td class="b lh-title pv1">Coinbase:</td>{' '}
            <td>
              {addressAbbr(address1st(rootState.wallet))}
            </td>
          </tr>
          <tr>
            <td class="b lh-title pv1">Available:</td>{' '}
            <td>
              {sem(state.accounts
                .map((a) => a.available)
                .reduce((sum, a) => sum.plus(a), ZERO),
              )}
            </td>
          </tr>
          <tr>
            <td class="b lh-title pv1">Locked:</td>{' '}
            <td>
              {sem(state.accounts
                .map((a) => a.locked)
                .reduce((sum, a) => sum.plus(a), ZERO),
              )}
            </td>
          </tr>
          <tr>
            <td class="b lh-title pv1">Total Balance:</td>{' '}
            <td>
              {sem(state.accounts
                .map((a) => a.available.plus(a.locked))
                .reduce((sum, a) => sum.plus(a), ZERO),
              )}
            </td>
          </tr>
        </table>
      </div>

      <div class="ml3 mw5 mw6-ns hidden ba">
        <h1 class="f5 bg-near-black white mv0 pv2 ph3">Transactions</h1>
        <table class="pa3">
          {state.transactions.map((tx) => {
            const [mathSign, img] = mathSignAndImg(state, tx)
            return <tr>
              <td><img src={`resources/${img}`} class="w2 h2 mt2 mr2" /></td>
              <td class="f6">
                <span class="b lh-title">{localeDateTime(tx.timestamp)}</span>
                <br/>
                {transfer(tx.from, tx.to)}
              </td>
              <td>
                <dl class="ml3 f6 lh-title mv2">
                  <dt class="f6 b">{mathSign}{sem(tx.value)}</dt>
                </dl>
              </td>
            </tr>
          })}

        </table>
      </div>

    </div>
  </div>
}

export function mathSignAndImg(state: HomeState, tx: TransactionType): [string, string] {
  const UNKNOWN: [string, string] = ['', 'unknown.png']
  return caseTypeOf<[string, string]>(tx, UNKNOWN, {
    vote: () => ['', 'vote.png'],
    unvote: () => ['', 'unvote.png'],
    transfer: () => {
      const ourFrom = state.transactions.some((t) => t.from === tx.from)
      const ourTo = state.transactions.some((t) => t.to === tx.to)
      return ourFrom && ourTo ? ['', 'cycle.png']
        : ourFrom ? ['-', 'outbound.png']
          : ourTo ? ['+', 'inbound.png']
            : UNKNOWN
    },
  })
}
