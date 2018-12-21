import Reader from './reader'
import Token from './token'
import NextState from './next-state'
import { EOS_FLAG } from './constants'
import { isNewLine, isAlpha } from './strings'

interface Cursor {
  line: number
  column: number
}

export class LexerError extends Error {
  public cursor: Cursor

  constructor(public message: string, cursor: Cursor) {
    super(message)
    this.name = 'LexerError'
    this.stack = (new Error() as any).stack
    this.cursor = cursor
  }
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

    const { char, isEOS } = this.next()
    if (isEOS) {
      tokens.push(Token.EOS)
      return tokens
    }

    if (isAlpha(char) || char === '!' || char === '=' || char === '>' || char === '<') {
      tokens.push(this.lexOperator(char))
    }

    return tokens
  }

  private lexOperator(char: string): Token {
    if (char === '=') {
      return Token.Operator
    }

    if (char === '!') {
      const c = this.peek()
      if (c !== '=') {
        throw new LexerError(`expected '=' after '!', got '${c}'`, this.cursor)
      }
    }
  }

  /**
   * Helpers
   */

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
