import Reader from './reader'
import { Token, t } from './token'
import NextState from './next-state'
import { EOS_FLAG } from './constants'
import { isNewLine, isAlpha, isTerminator, isIdent, isWhitespace, isNumber } from './strings'

const MAXIMUM_INDENT_LENGTH = 2000 // bug catcher

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

    while (true) {
      const { char, isEOS } = this.next()
      if (isEOS) {
        tokens.push(t.EOS())
        return tokens
      }

      if (isWhitespace(char)) {
        continue
      }

      if (isAlpha(char) || char === '!' || char === '=' || char === '>' || char === '<') {
        tokens.push(this.lexOperator(char))
      }
    }

    return tokens
  }

  private lexOperator(previous: string): Token {
    // =
    if (previous === '=') {
      return t.Operator('=')
    }

    // !=
    if (previous === '!') {
      if (this.accept('=')) {
        return t.Operator('!=')
      }

      throw new LexerError(`expected '=' after '!', got '${this.peek()}'`, this.cursor)
    }

    // and
    if (previous === 'a') {
      if (this.accept('nd')) {
        return t.Operator('and')
      }

      return this.lexIdent(previous)
    }

    // or
    if (previous === 'o') {
      if (this.accept('r')) {
        return t.Operator('or')
      }

      return this.lexIdent(previous)
    }

    // <=, >=, <, >
    if (previous === '<' || previous === '>') {
      if (this.accept('=')) {
        return t.Operator(previous + '=')
      }

      return t.Operator(previous)
    }

    // all other idents
    return this.lexIdent(previous)
  }

  private lexIdent(previous: string): Token {
    let str = ''
    while (isIdent(this.peek())) {
      const { char } = this.next()
      str += char

      if (str.length >= MAXIMUM_INDENT_LENGTH) {
        throw new LexerError('unreasonable literal length', this.cursor)
      }
    }

    const comingUp: string = this.peek()
    if (
      !(
        comingUp === EOS_FLAG ||
        isTerminator(comingUp) ||
        comingUp === '.' ||
        comingUp === '(' ||
        comingUp === '=' ||
        comingUp === '!'
      )
    ) {
      throw new LexerError(
        `expected termination character after identifier, got ${comingUp}`,
        this.cursor
      )
    }

    if (str === 'null') {
      return t.Null()
    }

    return t.Ident(previous + str)
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
