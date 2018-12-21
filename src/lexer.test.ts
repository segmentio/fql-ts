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
    fix('   ', [{ type: TokenType.EOS, value: 'eos' }], false),

    // Operators
    fix('=', [t.Operator('='), t.EOS()], false),
    fix('!=', [t.Operator('!='), t.EOS()], false),
    fix('and', [t.Operator('and'), t.EOS()], false),
    fix('or', [t.Operator('or'), t.EOS()], false),
    fix('<=', [t.Operator('<='), t.EOS()], false),
    fix('>=', [t.Operator('>='), t.EOS()], false),
    fix('<', [t.Operator('<'), t.EOS()], false),
    fix('>', [t.Operator('>'), t.EOS()], false),

    // a-starting idents (not and)
    fix('anna', [t.Ident('anna'), t.EOS()], false),
    fix('anna ', [t.Ident('anna'), t.EOS()], false),
    fix('anna abba', [t.Ident('anna'), t.Ident('abba'), t.EOS()], false),

    // o-starting idents (not or)
    fix('orange', [t.Ident('orange'), t.EOS()], false),
    fix('orange ', [t.Ident('orange'), t.EOS()], false),
    fix('or orange ', [t.Operator('or'), t.Ident('orange'), t.EOS()], false),
    fix('orange', [t.Ident('orange'), t.EOS()], false),

    // regular idents
    fix('zed', [t.Ident('zed'), t.EOS()], false),
    fix('bed zed', [t.Ident('bed'), t.Ident('zed'), t.EOS()], false),

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
