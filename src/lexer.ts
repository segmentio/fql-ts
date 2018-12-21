import Reader from './reader'
import { Token, TokenType } from './token'
import NextState from './next-state'
import { EOS_FLAG } from './constants'
import { isNewLine, isAlpha, isTerminator } from './strings'

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
    const tokens: Token[] = []

    const { char, isEOS } = this.next()
    if (isEOS) {
      tokens.push({ type: TokenType.EOS, value: 'eos' })
      return tokens
    }

    if (isAlpha(char) || char === '!' || char === '=' || char === '>' || char === '<') {
      tokens.push(this.lexOperator(char))
    }

    return tokens
  }

  private lexOperator(char: string): Token {
    if (char === '=') {
      return { type: TokenType.Operator, value: '=' }
    }

    if (char === '!') {
      const c = this.peek()
      if (c !== '=') {
        throw new LexerError(`expected '=' after '!', got '${c}'`, this.cursor)
      }

      return { type: TokenType.Operator, value: '!=' }
    }

    if (char === 'a') {
      if (this.accept('nd')) {
        return { type: TokenType.Operator, value: 'and' }
      }

      // TODO grab ident
    }
  }

  /**
   * Helpers
   */

  // Attempts to advance the string, rolls back and returns false if it can't.
  private accept(str: string): boolean {
    let chars = ''

    for (const _ of str) {
      const { char, isEOS } = this.next()
      if (isEOS || isTerminator(char)) {
        return false
      }

      chars += char
    }

    if (str === chars && isTerminator(this.peek())) {
      return true
    }

    this.backup(str.length)
    return false
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
