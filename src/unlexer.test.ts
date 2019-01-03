import lex from './lexer'
import unlex from './unlexer'
import { t } from './token'

test('Unlexer can convert tokens into a string', () => {
  const str = unlex([t.Ident('message'), t.Operator('='), t.Number('20')]).code

  expect(str).toEqual('message = 20')
})

test('Unlexer and lexer play nicely together', () => {
  const code = 'message = 20'
  expect(unlex(lex(code).tokens).code).toBe(code)
})