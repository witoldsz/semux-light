import { Buffer } from 'buffer'

export class Password {

  private readonly _value: Buffer

  constructor(value: string) {
    Object.defineProperty(this, '_value', {
      value: Buffer.from(value.trim()),
      writable: false,
      enumerable: false,
      configurable: false,
    })
  }

  get value(): string {
    return this._value.toString()
  }

  equals(other: Password) {
    return this.value === other.value
  }

  isEmpty() {
    return this.value.length < 1
  }

  toString() {
    return '[object Password]'
  }
}
