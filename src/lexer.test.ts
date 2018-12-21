import Lexer, { LexerError } from './lexer'
import { Token, TokenType } from './token'

interface Fixture {
  code: string
  tokens: Token[]
  throws: boolean
}

function fix(code: string, tokens: Token[], throws: boolean): Fixture {
  return {
    code,
    tokens,
    throws
  }
}

test('Lexer passes fixtures', () => {
  const fixtures: Fixture[] = [
    fix('', [{ type: TokenType.EOS, value: 'eos' }], false),

    // Operators
    fix('=', [{ type: TokenType.Operator, value: '=' }], false),
    fix('!=', [{ type: TokenType.Operator, value: '!=' }], false),
    fix('and', [{ type: TokenType.Operator, value: 'and' }], false),

    // idents
    fix('anna', [{ type: TokenType.Ident, value: 'anna' }], false),
    fix('anna(', [{ type: TokenType.Ident, value: 'anna' }], false),
    fix('anna.', [{ type: TokenType.Ident, value: 'anna' }], false),
    fix('anna!', [{ type: TokenType.Ident, value: 'anna' }], false),
    fix('anna=', [{ type: TokenType.Ident, value: 'anna' }], false),
    fix('anna ', [{ type: TokenType.Ident, value: 'anna' }], false),

    // errors
    fix('!', [{ type: TokenType.Operator, value: '!=' }], true)
  ]

  for (const { code, throws, tokens } of fixtures) {
    const lexer = new Lexer(code)
    if (throws) {
      expect(() => lexer.lex()).toThrowError(LexerError)
      continue
    }

    expect(lexer.lex()).toEqual(tokens)
  }
})
