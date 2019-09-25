import lex from './lexer'
import unlex from './unlexer'
import { t } from './token'

test('Unlexer can convert tokens into a string', () => {
  const str = unlex([t.Ident('message'), t.Operator('='), t.Number('20')]).code

  expect(str).toEqual('message = 20')
})

test('Unlexer escapes', () => {
  expect(unlex([t.Ident('a \\ b $')]).code).toEqual('a\\ \\\\\\ b\\ \\$')
  expect(unlex([t.Ident('a'), t.Dot(), t.Ident('b c')]).code).toEqual('a.b\\ c')
})

test('Unlexer and lexer play nicely together', () => {
  const code = 'message = 20'
  expect(unlex(lex(code).tokens).code).toBe(code)
})

test('unlexer keeps periods together', () => {
  expect(unlex([t.Ident('message'), t.Dot(), t.Ident('event')]).code).toBe('message.event')
  expect(unlex([t.Dot(), t.Ident('event')]).code).toBe('.event')
})

test("unlexer doesn't break on empty tokens", () => {
  expect(unlex([]).code).toBe('')
})
