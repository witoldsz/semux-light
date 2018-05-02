import { h } from 'hyperapp'
import { State } from './app'
import { coinbase, addressAbbr, sem } from './model/wallet'
import BigNumber from 'bignumber.js'
import { ZERO } from './lib/utils'
import { DateTime } from 'luxon'

export const Home = () => (s: State) => (
  <div class="pa2 flex">
    <div class="">
      <div class="mw5 mw6-ns hidden ba mv4">
        <h1 class="f5 bg-near-black white mv0 pv2 ph3">Overview</h1>
        <div class="pa3">
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Block #:</dt>{' '}
            <dd class="dib ml0">{s.blockNumber.map((a) => a.toFormat()).valueOr('')}</dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Block time:</dt>{' '}
            <dd class="dib ml0">{s.blockTime.map((a) => a.toLocaleString(DateTime.DATETIME_SHORT)).valueOr('')}</dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Coinbase:</dt>{' '}
            <dd class="dib ml0">{coinbase(s).fmap(addressAbbr).valueOr('')}</dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Available:</dt>{' '}
            <dd class="dib ml0">{sem(s.accounts
              .map((a) => a.available)
              .reduce((sum, a) => sum.plus(a), ZERO),
              )}
            </dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Locked:</dt>{' '}
            <dd class="dib ml0">{sem(s.accounts
              .map((a) => a.locked)
              .reduce((sum, a) => sum.plus(a), ZERO),
              )}</dd>
          </dl>
          <dl class="f6 lh-title mv2">
            <dt class="dib b">Total Balance:</dt>{' '}
            <dd class="dib ml0">{sem(s.accounts
              .map((a) => a.available.plus(a.locked))
              .reduce((sum, a) => sum.plus(a), ZERO),
              )}</dd>
          </dl>
        </div>
      </div>
    </div>

    <div class="">
      <div class="ml3 mw5 mw6-ns hidden ba mv4">
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
)
