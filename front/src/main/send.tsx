import { h } from 'hyperapp'

export const SendView = () => (
  <div class="pa2">
    <form>
      <div class="mv3">
        <label class="fw7 f6" for="fromInput">From</label>
        <input
          type="text"
          class="db w-100 pa2 mt2 br2 b--black-20 ba f6"
          id="fromInput"
          placeholder="0x…"
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="toInput">Password</label>
        <input
          type="text"
          class="db w-100 pa2 mt2 br2 b--black-20 ba f6"
          id="toInput"
          placeholder="0x…"
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="amountInput">Amount</label>
        <input
          id="amountInput"
          type="text"
          class="db w-100 pa2 mt2 br2 b--black-20 ba f6"
        />
      </div>
      <div class="mv3">
        <label class="fw7 f6" for="dataInput">Data</label>
        <input
          id="dataInput"
          type="text"
          class="db w-100 pa2 mt2 br2 b--black-20 ba f6"
        />
      </div>
      <button
        type="submit"
        class="pointer br2 ba b--black-20 bg-white pa2 mv1 bg-animate hover-bg-light-gray f6"
      >
        Send
      </button>
    </form>
  </div>
)
