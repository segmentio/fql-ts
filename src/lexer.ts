import Reader from './reader'
import Token from './token'
import NextState from './next-state'
import { EOS_FLAG } from './constants'
import { isNewLine } from './strings'

interface Cursor {
  line: number
  column: number
}

export default class Lexer {
  private reader: Reader
  private cursor: Cursor

  constructor(code: string) {
    this.reader = new Reader(code)
    this.cursor = {
      line: 0,
      column: 0
    }
  }

  public lex(): Token[] {
    const tokens = []

    const char = this.peek()
    if (char === EOS_FLAG) {
      tokens.push(Token.EOS)
    }

    return tokens
  }

  private next(): NextState {
    const { char, isEOS } = this.reader.forward()

    if (isNewLine(char)) {
      this.cursor.line += 1
      this.cursor.column = 0
    } else {
      this.cursor.column += 1
    }

    const c = isEOS ? EOS_FLAG : char
    return { char: c, isEOS }
  }

  // Looks at the next character and then goes back
  private peek(): string {
    const { char, isEOS } = this.next()
    if (!isEOS) {
      this.backup(1)
    }

    return char
  }

  private backup(count: number) {
    for (let n = count; n > 0; n--) {
      let char: string
      try {
        char = this.reader.backward().char
      } catch (err) {
        return
      }

      if (isNewLine(char)) {
        this.cursor.line -= 1
        this.cursor.column = 0
      } else {
        this.cursor.column -= 1
      }
    }
  }
}
