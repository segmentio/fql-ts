import ast, { AbstractSyntaxType, astToTokens, astToString } from './ast'
import lex from './lexer'
import { TokenType } from './token'

test('root node has root type', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.type).toBe(AbstractSyntaxType.ROOT)
})

test('second node has expr type', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.nodes.length).toBe(1)
  expect(node.nodes[0].type).toBe(AbstractSyntaxType.EXPR)
})

test('string types are recognized', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.nodes[0].leaves.length).toBe(1)
  expect(node.nodes[0].leaves[0].type).toBe(TokenType.String)
})

test('number types are recognized', () => {
  const { tokens } = lex(`1`)
  const { node } = ast(tokens)

  expect(node.nodes[0].leaves.length).toBe(1)
  expect(node.nodes[0].leaves[0].type).toBe(TokenType.Number)
})

test('null types are recognized', () => {
  const { tokens } = lex(`null`)
  const { node } = ast(tokens)

  expect(node.nodes[0].leaves.length).toBe(1)
  expect(node.nodes[0].leaves[0].type).toBe(TokenType.Null)
})

test('single paths are recognized', () => {
  const { tokens } = lex(`message`)
  const { node } = ast(tokens)

  const path = node.nodes[0].nodes[0]

  expect(path.type).toBe(AbstractSyntaxType.PATH)
  expect(path.leaves[0].type).toBe(TokenType.Ident)
  expect(path.leaves[0].value).toBe('message')
})

test('multi paths are recognized', () => {
  const { tokens } = lex(`message.event.property`)
  const { node } = ast(tokens)
  const path = node.nodes[0].nodes[0]

  expect(path.type).toBe(AbstractSyntaxType.PATH)

  // message
  expect(path.leaves[0].type).toBe(TokenType.Ident)
  expect(path.leaves[0].value).toBe('message')

  // .
  expect(path.leaves[1].type).toBe(TokenType.Dot)

  // event
  expect(path.leaves[2].type).toBe(TokenType.Ident)
  expect(path.leaves[2].value).toBe('event')

  // .
  expect(path.leaves[3].type).toBe(TokenType.Dot)

  // property
  expect(path.leaves[4].type).toBe(TokenType.Ident)
  expect(path.leaves[4].value).toBe('property')
})

test('Multiple statements work', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  expect(node.nodes.length).toBe(3)
  expect(node.nodes[0].type).toBe(AbstractSyntaxType.EXPR)
  expect(node.nodes[1].type).toBe(AbstractSyntaxType.OPERATOR)
  expect(node.nodes[2].type).toBe(AbstractSyntaxType.EXPR)
})

test('Operator is recorded correctly', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  expect(node.nodes.length).toBe(3)

  // Operator is recorded correctly, wrapped in a node
  expect(node.nodes[1].type).toBe(AbstractSyntaxType.OPERATOR)
  expect(node.nodes[1].leaves[0].type).toBe(TokenType.Operator)
  expect(node.nodes[1].leaves[0].value).toBe('=')
})

test('Literals are recorded correctly', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  expect(node.nodes.length).toBe(3)

  // Operator is recorded correctly, wrapped in a node
  expect(node.nodes[2].type).toBe(AbstractSyntaxType.EXPR)
  expect(node.nodes[2].leaves[0].type).toBe(TokenType.String)
  expect(node.nodes[2].leaves[0].value).toBe(`"foo"`)
})

test('astToTokens can correctly convert to tokens', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node } = ast(tokens)

  expect(astToTokens(node)).toEqual(tokens)
})

test('astToString can correctly convert tokens', () => {
  const { tokens } = lex('message.event')
  const { node } = ast(tokens)

  expect(astToString(node)).toBe('message.event')
})
