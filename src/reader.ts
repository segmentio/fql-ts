import NextState from './next-state'

export default class Reader {
  public code: string
  private position: number

  constructor(code: string) {
    this.code = code
    this.position = 0
  }

  public forward(): NextState {
    if (this.code.length === this.position) {
      return { char: '', isEOS: true }
    }

    const char = this.code.charAt(this.position)
    this.position += 1

    return {
      char,
      isEOS: false
    }
  }

  public backward(): NextState {
    if (this.position === 0) {
      throw new RangeError()
    }

    const char = this.code.charAt(this.position)
    this.position -= 1

    return {
      char,
      isEOS: false
    }
  }

  public getPosition(): number {
    return this.position
  }
}
