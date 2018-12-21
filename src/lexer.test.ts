import Lexer, { LexerError } from './lexer'
import { Token, t } from './token'

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

function testFixtures(fixtures: Fixture[]) {
  for (const { code, throws, tokens } of fixtures) {
    const lexer = new Lexer(code)
    if (throws) {
      expect(() => lexer.lex()).toThrowError(LexerError)
      continue
    }

    expect(lexer.lex()).toEqual(tokens)
  }
}

test('Lexer passes error fixtures', () => {
  testFixtures([
    fix('"', [], true),
    fix('"  ', [], true),
    fix('" " " ', [], true),
    fix('"abd', [], true),
    fix('abd "', [], true),
    fix('5.', [], true),
    fix('5. ', [], true),
    fix('5.0.', [], true),
    fix('5.0.0.0', [], true),
    fix('!', [], true),

    // Invalid characters
    fix('$', [], true),
    fix('@', [], true),
    fix('#', [], true),
    fix('*', [], true),
    fix('`', [], true),
    fix('\\', [], true),
    fix('/', [], true)
  ])
})

test('Lexer passes ident fixtures', () => {
  testFixtures([
    // a-starting idents (not and)
    fix('a b', [t.Ident('a'), t.Ident('b'), t.EOS()], false),
    fix('andeverything', [t.Ident('andeverything'), t.EOS()], false),
    fix('anna', [t.Ident('anna'), t.EOS()], false),
    fix('anna ', [t.Ident('anna'), t.EOS()], false),
    fix('anna abba', [t.Ident('anna'), t.Ident('abba'), t.EOS()], false),

    // o-starting idents (not or)
    fix('orange', [t.Ident('orange'), t.EOS()], false),
    fix('orange ', [t.Ident('orange'), t.EOS()], false),
    fix('or orange ', [t.Operator('or'), t.Ident('orange'), t.EOS()], false),
    fix('orange', [t.Ident('orange'), t.EOS()], false),

    // n-starting idents (not null)
    fix('normandy', [t.Ident('normandy'), t.EOS()], false),
    fix('nullify', [t.Ident('nullify'), t.EOS()], false),

    // regular idents
    fix('zed', [t.Ident('zed'), t.EOS()], false),
    fix('bed zed', [t.Ident('bed'), t.Ident('zed'), t.EOS()], false),

    // Dangerous idents for stupid javascript reasons
    fix('Infinity', [t.Ident('Infinity'), t.EOS()], false),
    fix('undefined', [t.Ident('undefined'), t.EOS()], false)
  ])
})

test('Lexer passes operator fixtures', () => {
  testFixtures([
    fix('=', [t.Operator('='), t.EOS()], false),
    fix('!=', [t.Operator('!='), t.EOS()], false),
    fix('and', [t.Operator('and'), t.EOS()], false),
    fix('or', [t.Operator('or'), t.EOS()], false),
    fix('<=', [t.Operator('<='), t.EOS()], false),
    fix('>=', [t.Operator('>='), t.EOS()], false),
    fix('<', [t.Operator('<'), t.EOS()], false),
    fix('>', [t.Operator('>'), t.EOS()], false)
  ])
})

test('Lexer passes Number fixtures', () => {
  testFixtures([
    // Integers
    fix('1', [t.Number('1'), t.EOS()], false),
    fix('9', [t.Number('9'), t.EOS()], false),
    fix('0', [t.Number('0'), t.EOS()], false),
    fix('10', [t.Number('10'), t.EOS()], false),
    fix('10 10', [t.Number('10'), t.Number('10'), t.EOS()], false),
    fix('10000000 10', [t.Number('10000000'), t.Number('10'), t.EOS()], false),

    // Decimals
    fix('0.4', [t.Number('0.4'), t.EOS()], false),
    fix('0.4 10.4', [t.Number('0.4'), t.Number('10.4'), t.EOS()], false),

    // Negatives and positives
    fix('-4', [t.Number('-4'), t.EOS()], false),
    fix('+5', [t.Number('+5'), t.EOS()], false),

    // Negative and positive decimals
    fix('+5.4', [t.Number('+5.4'), t.EOS()], false),
    fix('-3.2', [t.Number('-3.2'), t.EOS()], false)
  ])
})

test('Lexer passes Strings fixtures', () => {
  testFixtures([
    // Strings
    fix('"d"', [t.String('"d"'), t.EOS()], false),
    fix('"and"', [t.String('"and"'), t.EOS()], false),
    fix('"or and"', [t.String('"or and"'), t.EOS()], false),
    fix('"a" "b"', [t.String('"a"'), t.String('"b"'), t.EOS()], false)
  ])
})

test('Lexer passes bracket+paren fixtures', () => {
  testFixtures([
    // Brackets
    fix('[', [t.BrackLeft(), t.EOS()], false),
    fix('["dogs"', [t.BrackLeft(), t.String('"dogs"'), t.EOS()], false),
    fix('["dogs"]', [t.BrackLeft(), t.String('"dogs"'), t.BrackRight(), t.EOS()], false),
    fix(']', [t.BrackRight(), t.EOS()], false),
    fix(']"dogs"', [t.BrackRight(), t.String('"dogs"'), t.EOS()], false),

    // Parens
    fix('(', [t.ParenLeft(), t.EOS()], false),
    fix('("dogs"', [t.ParenLeft(), t.String('"dogs"'), t.EOS()], false),
    fix('("dogs")', [t.ParenLeft(), t.String('"dogs"'), t.ParenRight(), t.EOS()], false),
    fix(')', [t.ParenRight(), t.EOS()], false),
    fix(')"dogs"', [t.ParenRight(), t.String('"dogs"'), t.EOS()], false)
  ])
})

test('Lexer passes comma fixtures', () => {
  testFixtures([
    fix(',', [t.Comma(), t.EOS()], false),
    fix('a,', [t.Ident('a'), t.Comma(), t.EOS()], false),
    fix('a,b', [t.Ident('a'), t.Comma(), t.Ident('b'), t.EOS()], false),
    fix('a,b ', [t.Ident('a'), t.Comma(), t.Ident('b'), t.EOS()], false)
  ])
})

test('Lexer passes misc fixtures', () => {
  testFixtures([
    fix('', [t.EOS()], false),
    fix('   ', [t.EOS()], false),

    // null
    fix('null', [t.Null(), t.EOS()], false)
  ])
})

test('Lexer passes dot fixtures', () => {
  testFixtures([
    fix('.', [t.Dot(), t.EOS()], false),
    fix('. ', [t.Dot(), t.EOS()], false),
    fix(' .', [t.Dot(), t.EOS()], false),
    fix('message.event', [t.Ident('message'), t.Dot(), t.Ident('event'), t.EOS()], false)
  ])
})
