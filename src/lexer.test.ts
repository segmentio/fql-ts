import Lexer, { LexerError } from './lexer'
import Token from './token'

test('Lexer returns an EOS on an empty string', () => {
  const lexer = new Lexer('')

  expect(lexer.lex()).toEqual([Token.EOS])
})

test('Lexer returns an operator on "="', () => {
  const lexer = new Lexer('=')

  expect(lexer.lex()).toEqual([Token.Operator])
})

test('Lexer throws an error on "!" with no "="', () => {
  const lexer = new Lexer('!')

  expect(() => lexer.lex()).toThrowError(LexerError)
})
