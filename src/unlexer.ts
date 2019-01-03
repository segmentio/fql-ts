import { Token, TokenType } from './token'

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
  for (const token of tokens) {
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

    str += token.value
  }

  return { code: str.trim() }
}
