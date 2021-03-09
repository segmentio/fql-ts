import { lex, t, types, ast, astToTokens } from './index'
import unlex from './unlexer'

test('we can use the imported lexer', () => {
  expect(lex(`message.event = "Order Completed" and amount > 100`).tokens).toEqual([
    t.Ident('message'),
    t.Dot(),
    t.Ident('event'),
    t.Operator('='),
    t.String(`"Order Completed"`),
    t.Conditional('and'),
    t.Ident('amount'),
    t.Operator('>'),
    t.Number('100'),
    t.EOS()
  ])
})

test('we get reasonable errors', () => {
  const { error } = lex('message.event > 30.30.30')
  expect(error.cursor.line).toBe(0)
  expect(error.cursor.column).toBe(22)
  expect(error.message).toBeTruthy()
})

test('we can use the imported unlexer', () => {
  expect(unlex([t.Null(), t.EOS()]).code).toEqual('null')
})

test('we can use the imported types', () => {
  expect(t.Operator('=').type).toBe(types.Operator)
})

test('we can use the imported ast and astToTokens', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node } = ast(tokens)

  expect(astToTokens(node)).toEqual(tokens)
})
