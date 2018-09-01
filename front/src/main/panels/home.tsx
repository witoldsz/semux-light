import { h } from 'hyperapp'
import { State, Actions } from '../app'
import { ZERO, concat } from '../lib/utils'
import { BlockType, fetchLatestBlock } from '../model/block'
import { AccountType, fetchAccount } from '../model/account'
import { Maybe, maybe } from 'tsmonad'
import { TransactionType, caseTypeOf, fetchTxs } from '../model/transaction'
import { localeDateTime, transfer, sem, addressAbbr } from '../lib/format'
import { addresses, address1st, WalletState } from '../model/wallet'
import { calculateRange } from '../lib/pagination'

const MAX_TXS_SIZE = 5
const FETCH_INTERVAL = 20000

export interface HomeState {
  errorMessage: string,
  block: Maybe<BlockType>
  accounts: AccountType[]
  transactions: TransactionType[]
  fetchTimeoutId: any
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
  const pageRange = calculateRange({
    totalCount: account.transactionCount,
    pageNumber: 0,
    pageSize: MAX_TXS_SIZE,
    dir: 'Desc',
  })
  const transactions = await fetchTxs(account.address, pageRange.from, pageRange.to)
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

    maybe(state.fetchTimeoutId).lift(clearTimeout)
    return {
      ...state,
      fetchTimeoutId: setTimeout(() => actions.fetch(rootState), FETCH_INTERVAL),
      errorMessage: '',
    }
  },

  cancelNextFetch: () => (state) => {
    maybe(state.fetchTimeoutId).lift(clearTimeout)
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

interface TransactionsViewProps {
  accounts: AccountType[]
  transactions: TransactionType[]
}

const TransactionsView = ({ transactions, accounts }: TransactionsViewProps) => (
  <div class={blackBoxClass}>
    <h1 class="f5 bg-near-black white mv0 pv2 ph3">Transactions</h1>
    <table class="pa3">
      {transactions.map((tx) => {
        const [mathSign, img] = mathSignAndImg(accounts, tx)
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
)

interface OverviewViewProps {
  block: Maybe<BlockType>
  accounts: AccountType[]
  wallet: WalletState
}

const OverviewView = ({ block, accounts, wallet }: OverviewViewProps) => (
  <div class={blackBoxClass}>
    <h1 class="f5 bg-near-black white mv0 pv2 ph3">Overview</h1>
    <table class="pa3 f6">
      <tr>
        <td class="b lh-title pv1">Block #:</td>
        <td>
          {block.map((b) => b.number.toLocaleString()).valueOr('')}
        </td>
      </tr>
      <tr>
        <td class="b lh-title pv1">Block time:</td>
        <td>
          {block.map(({ timestamp: d }) => localeDateTime(d)).valueOr('')}
        </td>
      </tr>
      <tr>
        <td class="b lh-title pv1">Coinbase:</td>
        <td>
          {addressAbbr(address1st(wallet))}
        </td>
      </tr>
      <tr>
        <td class="b lh-title pv1">Available:</td>
        <td>
          {sem(accounts
            .map((a) => a.available)
            .reduce((sum, a) => sum.plus(a), ZERO),
          )}
        </td>
      </tr>
      <tr>
        <td class="b lh-title pv1">Locked:</td>
        <td>
          {sem(accounts
            .map((a) => a.locked)
            .reduce((sum, a) => sum.plus(a), ZERO),
          )}
        </td>
      </tr>
      <tr>
        <td class="b lh-title pv1">Total Balance:</td>
        <td>
          {sem(accounts
            .map((a) => a.available.plus(a.locked))
            .reduce((sum, a) => sum.plus(a), ZERO),
          )}
        </td>
      </tr>
    </table>
  </div>
)

export function HomeView(rootState: State, rootActions: Actions) {
  const state = rootState.home
  const actions = rootActions.home
  return <div
    class="pa2 overflow-x-auto"
    key="HomeView"
    oncreate={() => actions.fetch(rootState)}
    ondestroy={() => actions.cancelNextFetch()}
  >
    {state.errorMessage
      ? <div class="dark-red pb3">{state.errorMessage}</div>
      : ''
    }
    <div class="flex flex-wrap">
      <OverviewView accounts={state.accounts} wallet={rootState.wallet} block={state.block}/>
      <TransactionsView transactions={state.transactions} accounts={state.accounts}/>
    </div>
  </div>
}

export function mathSignAndImg(accounts: AccountType[], tx: TransactionType): [string, string] {
  const UNKNOWN: [string, string] = ['', 'unknown.png']
  return caseTypeOf<[string, string]>(tx, UNKNOWN, {
    vote: () => ['', 'vote.png'],
    unvote: () => ['', 'unvote.png'],
    transfer: () => {
      const ourFrom = accounts.some((t) => t.address === tx.from)
      const ourTo = accounts.some((t) => t.address === tx.to)
      return ourFrom && ourTo ? ['', 'cycle.png']
        : ourFrom ? ['-', 'outbound.png']
          : ourTo ? ['+', 'inbound.png']
            : UNKNOWN
    },
  })
}

const blackBoxClass = [
  'w-100',
  'ba',
  'w-auto-ns',
  'mw6-ns',
  'mr3-ns',
  'mb3',
].join(' ')
