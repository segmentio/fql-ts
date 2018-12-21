import Lexer, { LexerError } from './lexer'
import { Token, TokenType, t } from './token'

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
    fix('=', [t.Operator('='), t.EOS()], false),
    fix('!=', [t.Operator('!='), t.EOS()], false),
    fix('and', [t.Operator('and'), t.EOS()], false),

    // idents
    fix('anna', [t.Ident('anna'), t.EOS()], false),
    fix('anna ', [t.Ident('anna'), t.EOS()], false),

    fix('anna abba', [t.Ident('anna'), t.Ident('abba'), t.EOS()], false),

    // errors
    fix('!', [], true)
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
