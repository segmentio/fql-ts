import Reader from './reader'
import { Token, t } from './token'
import NextState from './next-state'
import { EOS_FLAG } from './constants'
import { isNewLine, isAlpha, isTerminator, isIdent, isWhitespace, isNumber } from './strings'

const MAXIMUM_INDENT_LENGTH = 100000 // bug catcher
const MAXIMUM_NUMBER_LENGTH = 100000
const MAXIMUM_STRING_LENGTH = 100000

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

      if (isNumber(char) || char === '-' || char === '+') {
        tokens.push(this.lexNumber(char))
      }

      if (char === '"') {
        tokens.push(this.lexString())
      }
    }
  }

  private lexString(): Token {
    let str = ''
    while (this.peek() !== '"') {
      const { char, isEOS } = this.next()
      str += char

      if (isEOS) {
        throw new LexerError('unterminated string', this.cursor)
      }

      if (str.length >= MAXIMUM_STRING_LENGTH) {
        throw new LexerError('unreasonable string length', this.cursor)
      }
    }

    this.accept('"') // Eat the last quote
    return t.String(`"${str}"`)
  }

  private lexNumber(previous: string): Token {
    let str = ''
    let comingUp: string = this.peek()
    let isDecimal = false
    while (isNumber(comingUp) || comingUp === '.') {
      const { char } = this.next()
      str += char

      // Prevent multiple decimal points and stray decimal points
      if (comingUp === '.') {
        if (isTerminator(this.peek())) {
          throw new LexerError('unexpected terminator after decimal point', this.cursor)
        }

        if (isDecimal) {
          throw new LexerError('multiple decimal points in one number', this.cursor)
        }

        isDecimal = true
      }

      // Prevent infinite loops
      if (str.length >= MAXIMUM_NUMBER_LENGTH) {
        throw new LexerError('unreasonable number length', this.cursor)
      }

      comingUp = this.peek()
    }

    return t.Number(previous + str)
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

    // null
    if (previous === 'n') {
      if (this.accept('ull')) {
        return t.Null()
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
