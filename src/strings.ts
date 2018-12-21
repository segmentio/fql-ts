import { EOS_FLAG } from './constants'

export function isNewLine(c: string): boolean {
  return c === '\r' || c === '\n'
}

export function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n'
}

export function isAlpha(c: string): boolean {
  return !!c.match(/[a-z]/i)
}

export function isNumber(c: string): boolean {
  if (c === EOS_FLAG) {
    return false
  }

  return !isNaN(parseFloat(c)) && isFinite(parseInt(c, 10))
}

export function isIdent(c: string): boolean {
  if (c === EOS_FLAG) {
    return false
  }

  return isAlpha(c) || isNumber(c) || c === '_' || c === '-'
}

export function isTerminator(c: string): boolean {
  return c === EOS_FLAG || isWhitespace(c) || c === ',' || c === ']' || c === ')'
}
