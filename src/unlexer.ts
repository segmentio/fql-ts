import { Token, TokenType } from './token'
import { isIdent } from './strings'

export class UnlexerError extends Error {
  constructor(public message: string) {
    super(message)
    this.name = 'UnlexerError'
    this.stack = (new Error() as any).stack
  }
}

interface UnLexResponse {
  code: string
  error?: UnlexerError
}

export default function unlex(tokens: Token[]): UnLexResponse {
  let str = ''
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    // Break if we hit an EOS
    if (token.type === TokenType.EOS) {
      break
    }

    if (token.type === TokenType.Err) {
      return {
        code: str,
        error: new UnlexerError(`Unlexing hit an error with message: "${token.value}"`)
      }
    }

    // Don't add unecessary spaces to dots
    if (token.type === TokenType.Dot) {
      str += token.value
      continue
    }

    // Add a space, but not after dots
    if (i > 0 && tokens[i - 1].type !== TokenType.Dot) {
      str += ' '
    }

    if (token.type === TokenType.Ident) {
      str += escape(token.value)
    } else {
      str += token.value
    }
  }

  return { code: str.trim() }
}

function escape(str: string): string {
  let escaped = ''
  for (const c of str) {
    if (!isIdent(c) || c == '\\') {
      escaped += '\\'
    }
    escaped += c
  }
  return escaped
}