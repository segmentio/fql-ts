import ast from './ast'
import lex from './lexer'
import { getASTNode, getToken } from './access'
import { TokenType } from './token'

test('can get a deeply embedded node', () => {
  const { tokens } = lex(`message.event = "foo"`)
  const { node } = ast(tokens)

  const value = getASTNode(node, 'children[0].children[0]')
  expect(value.type).toBe('path')
})

test('can get a deeply embedded token', () => {
  const { tokens } = lex(`message.event = "foo"`)
  const { node } = ast(tokens)

  const value = getToken(node, 'children[0].children[0].children[0]')
  expect(value.value).toBe('message')
})

test('can access different tokens', () => {
  const { tokens } = lex(`message`)
  const { node } = ast(tokens)

  // expr -> path -> token[0]
  const token = getToken(node, 'children[0].children[0].children[0]')
  expect(token.type).toBe(TokenType.Ident)
  expect(token.value).toBe('message')
})
