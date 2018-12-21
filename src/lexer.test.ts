import Lexer, { LexerError } from './lexer'
import { TokenType } from './token'

test('Lexer returns an EOS on an empty string', () => {
  const lexer = new Lexer('')

  expect(lexer.lex()).toEqual([{ type: TokenType.EOS, value: 'eos' }])
})

test('Lexer returns an operator on "="', () => {
  const lexer = new Lexer('=')

  expect(lexer.lex()).toEqual([{ type: TokenType.Operator, value: '=' }])
})

test('Lexer returns an operator on "="', () => {
  const lexer = new Lexer('!=')

  expect(lexer.lex()).toEqual([{ type: TokenType.Operator, value: '!=' }])
})

test('Lexer returns an operator on "="', () => {
  const lexer = new Lexer('and')

  expect(lexer.lex()).toEqual([{ type: TokenType.Operator, value: 'and' }])
})

test('Lexer throws an error on "!" with no "="', () => {
  const lexer = new Lexer('!')

  expect(() => lexer.lex()).toThrowError(LexerError)
})
