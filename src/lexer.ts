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

interface LexResponse {
  tokens: Token[]
  error?: LexerError
}

/**
 * Converts FQL code into tokens.
 * @param code the FQL code to convert
 * @throws LexerError if something goes wrong
 */
export default function lex(code: string): LexResponse {
  try {
    const lexer = new Lexer(code)
    return { tokens: lexer.lex() }
  } catch (error) {
    return { tokens: [], error }
  }
}

export class Lexer {
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

      if (char === '!') {
        const nextChar = this.peek()

        if (isAlpha(nextChar) || nextChar === '(') {
          tokens.push(t.Operator('!'))
          continue
        }
      }

      if (isAlpha(char) || char === '!' || char === '=' || char === '>' || char === '<' || char === '_') {
        tokens.push(this.lexOperatorOrConditional(char))
        continue
      }

      if (isNumber(char) || char === '-' || char === '+') {
        tokens.push(this.lexNumber(char))
        continue
      }

      if (char === '"' || char === '\'') {
        tokens.push(this.lexString(char))
        continue
      }

      if (char === '.') {
        tokens.push(t.Dot())
        continue
      }

      if (char === '[') {
        tokens.push(t.BrackLeft())
        continue
      }

      if (char === ']') {
        tokens.push(t.BrackRight())
        continue
      }

      if (char === ',') {
        tokens.push(t.Comma())
        continue
      }
      
      if (char === '(') {
        tokens.push(t.ParenLeft())
        continue
      }

      if (char === ')') {
        tokens.push(t.ParenRight())
        continue
      }

      throw new LexerError(`invalid character "${char}"`, this.cursor)
    }
  }

  private lexString(openQuote: string): Token {
    let str = ''
    // Looking for closing string of same type of quote (single or double)
    while (this.peek() !== openQuote) {
      const { char, isEOS } = this.next()
      str += char

      if (isEOS) {
        throw new LexerError('unterminated string', this.cursor)
      }

      if (str.length >= MAXIMUM_STRING_LENGTH) {
        throw new LexerError('unreasonable string length', this.cursor)
      }
    }

    this.accept(openQuote) // Eat the last quote
    return t.String(`${openQuote}${str}${openQuote}`)
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

  private lexOperatorOrConditional(previous: string): Token {
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
        return t.Conditional('and')
      }

      return this.lexIdent(previous)
    }

    // or
    if (previous === 'o') {
      if (this.accept('r')) {
        return t.Conditional('or')
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
      let { char } = this.next()

      // Allow escaping of any character except EOS
      if (char === '\\') {
        if (this.peek() === EOS_FLAG) {
          throw new LexerError('expected character after escape character, got EOS', this.cursor)
        }
        char = this.next().char
      }

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
      chars += char

      if (isEOS) {
        return false
      }

      if (isTerminator(char)) {
        break
      }
    }

    if (str === chars && isTerminator(this.peek())) {
      return true
    }

    this.backup(chars.length)
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
