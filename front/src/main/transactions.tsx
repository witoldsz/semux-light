import { h } from 'hyperapp'

export const TransactionsView = () => (
  <div class="pa2">
    <div class="overflow-auto">
      <table class="f6 w-100 mw8" cellspacing="0">
        <thead>
          <tr>
            <th class="fw6 bb b--black-20 tl pb1 pr3 ">Type</th>
            <th class="fw6 bb b--black-20 tl pb1 pr3 ">From/To</th>
            <th class="fw6 bb b--black-20 tl pb1 pr3 ">Value</th>
            <th class="fw6 bb b--black-20 tl pb1 pr3 ">Time</th>
            <th class="fw6 bb b--black-20 tl pb1 pr3 ">Status</th>
          </tr>
        </thead>
        <tbody class="lh-copy">
          <tr class="hover-bg-washed-blue">
            <td class="pv2 pr3 bb b--black-20">TRANSFER</td>
            <td class="pv2 pr3 bb b--black-20">0x7acb…12b0 → perf</td>
            <td class="pv2 pr3 bb b--black-20">7 SEM</td>
            <td class="pv2 pr3 bb b--black-20">4/30/18 12:37 PM</td>
            <td class="pv2 pr3 bb b--black-20">Completed</td>
          </tr>
          <tr class="hover-bg-washed-blue">
            <td class="pv2 pr3 bb b--black-20">TRANSFER</td>
            <td class="pv2 pr3 bb b--black-20">faucet → 0xd656…fa30</td>
            <td class="pv2 pr3 bb b--black-20">1,001 SEM</td>
            <td class="pv2 pr3 bb b--black-20">4/28/18 1:44 PM</td>
            <td class="pv2 pr3 bb b--black-20">Completed</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
)
