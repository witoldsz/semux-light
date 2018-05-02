import { h } from 'hyperapp'

export const DelegatesView = () => (
  <div class="pa2">
    <div class="overflow-auto">
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
          <tr class="hover-bg-washed-blue">
            <td class="pv2 pr3 bb b--black-20">1</td>
            <td class="pv2 pr3 bb b--black-20">testnet</td>
            <td class="pv2 pr3 bb b--black-20">0x837c…7313</td>
            <td class="pv2 pr3 bb b--black-20">51,090</td>
            <td class="pv2 pr3 bb b--black-20">0</td>
            <td class="pv2 pr3 bb b--black-20">Validator</td>
            <td class="pv2 pr3 bb b--black-20">94.1 %</td>
          </tr>
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
  </div>
)
