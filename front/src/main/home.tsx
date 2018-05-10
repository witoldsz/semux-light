import { h } from 'hyperapp'
import { State } from './app'
import { addressAbbr, sem } from './model/wallet'
import BigNumber from 'bignumber.js'
import { ZERO, firstEitherError, catEithers } from './lib/utils'
import { DateTime } from 'luxon'
import { BlockType, fetchLatestBlock, BlockTypeResponse } from './model/block'
import { AccountType, AccountTypeResponse, fetchAccount } from './model/account'
import { Maybe } from 'tsmonad'
import { WebData } from './lib/webdata'
import { locationAddrs, LocationState } from './lib/location'

export interface HomeState {
  error: string,
  block: Maybe<BlockType>
  accounts: AccountType[]
}

export const initialHomeState: HomeState = {
  error: '',
  block: Maybe.nothing(),
  accounts: [],
}

export interface HomeActions {
  fetch: (ls: LocationState) => (s: HomeState, a: HomeActions) => HomeState
  fetchBlockResponse: (b: BlockTypeResponse) => (s: HomeState) => HomeState
  fetchAccountsResponse: (a: AccountTypeResponse[]) => (s: HomeState) => HomeState
}

export const rawHomeActions: HomeActions = {
  fetch: (locationState) => (state, actions) => {
    fetchLatestBlock().then(actions.fetchBlockResponse)

    Promise
      .all(locationAddrs(locationState).map(fetchAccount))
      .then(actions.fetchAccountsResponse)

    return { ...state, error: '' }
  },
  fetchBlockResponse: (blockE) => (state) => {
    return { ...state, ...blockE.caseOf({
      left: (error) => ({ block: Maybe.nothing<BlockType>(), error }),
      right: (block) => ({ block: Maybe.just(block), error: state.error }),
    })}
  },
  fetchAccountsResponse: (accountsEs) => (state) => {
    const accounts = catEithers(accountsEs)
    // TODO: fetch 5 last txs from accounts, merge, sort, trim
    return {
      ...state,
      error: firstEitherError(accountsEs).valueOr(''),
      accounts,
    }
  },
}

export function HomeView(rootState: State) {
  const state = rootState.home
  return <div class="pa2">
    {state.error
      ? <div class="dark-red">{state.error}</div>
      : ''
    }
    <div class="flex">
      <div class="mw5 mw6-ns hidden ba">
        <h1 class="f5 bg-near-black white mv0 pv2 ph3">Overview</h1>
        <div class="pa3">
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Block #:</dt>{' '}
            <dd class="dib ml0">
              {state.block.map((b) => b.number.toLocaleString()).valueOr('')}
            </dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Block time:</dt>{' '}
            <dd class="dib ml0">{
              state.block.map(({ timestamp: d }) =>
                `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`).valueOr('')
              }
            </dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Coinbase:</dt>{' '}
            <dd class="dib ml0">
              TODO
            </dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Available:</dt>{' '}
            <dd class="dib ml0">{sem(state.accounts
              .map((a) => a.available)
              .reduce((sum, a) => sum.plus(a), ZERO),
              )}
            </dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Locked:</dt>{' '}
            <dd class="dib ml0">{sem(state.accounts
              .map((a) => a.locked)
              .reduce((sum, a) => sum.plus(a), ZERO),
              )}</dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Total Balance:</dt>{' '}
            <dd class="dib ml0">{sem(state.accounts
              .map((a) => a.available.plus(a.locked))
              .reduce((sum, a) => sum.plus(a), ZERO),
              )}</dd>
          </dl>
        </div>
      </div>

      <div class="ml3 mw5 mw6-ns hidden ba">
        <h1 class="f5 bg-near-black white mv0 pv2 ph3">Transactions</h1>
        <div class="pa3">
          <div class="flex">
            <img src="resources/inbound.png" class="w2 h2 mt2 mr2" />
            <dl class="f6 lh-title mv2">
              <dt class="f6 b">4/28/18 1:44 PM</dt>
              <dd class="ml0">faucet => 0xd656…fa30</dd>
            </dl>
            <dl class="ml3 f6 lh-title mv2">
              <dt class="f6 b">+1,001 SEM</dt>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
}
