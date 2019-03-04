import ast, { AbstractSyntaxType, astToTokens, astToString, isASTNode } from './ast'
import lex from './lexer'
import { TokenType } from './token'
import { getASTNode, getToken } from './access'

test('root node has root type', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.type).toBe(AbstractSyntaxType.ROOT)
})

test('second node has expr type', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.children.length).toBe(1)
  expect(node.children[0].type).toBe(AbstractSyntaxType.EXPR)
})

test('string types are recognized', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  const expr = node.children[0]
  if (isASTNode(expr)) {
    expect(expr.children.length).toBe(1)
    expect(expr.children[0].type).toBe(TokenType.String)
  } else {
    fail('expected node')
  }
})

test('number types are recognized', () => {
  const { tokens } = lex(`1`)
  const { node } = ast(tokens)

  const expr = node.children[0]
  if (isASTNode(expr)) {
    expect(expr.children.length).toBe(1)
    expect(expr.children[0].type).toBe(TokenType.Number)
  } else {
    fail('expected node')
  }
})

test('null types are recognized', () => {
  const { tokens } = lex(`null`)
  const { node } = ast(tokens)

  const expr = node.children[0]
  if (isASTNode(expr)) {
    expect(expr.children.length).toBe(1)
    expect(expr.children[0].type).toBe(TokenType.Null)
  } else {
    fail('expected node')
  }
})

test('paths work', () => {
  const { tokens } = lex(`message`)
  const { node } = ast(tokens)

  // expr -> path -> token[0]
  const token = getToken(node, 'children[0].children[0].children[0]')
  expect(token.type).toBe(TokenType.Ident)
  expect(token.value).toBe('message')
})

test('multi paths are recognized', () => {
  const { tokens } = lex(`message.event.property`)
  const { node } = ast(tokens)

  const path = getASTNode(node, 'children[0].children[0]')
  expect(path.type).toBe(AbstractSyntaxType.PATH)

  // message
  const message = getToken(path, 'children[0]')
  expect(message.type).toBe(TokenType.Ident)
  expect(message.value).toBe('message')

  // .
  const dot1 = getToken(path, 'children[1]')
  expect(dot1.type).toBe(TokenType.Dot)

  // event
  const event = getToken(path, 'children[2]')
  expect(event.type).toBe(TokenType.Ident)
  expect(event.value).toBe('event')

  // .
  const dot2 = getToken(path, 'children[3]')
  expect(dot2.type).toBe(TokenType.Dot)

  // property
  const property = getToken(path, 'children[4]')
  expect(property.type).toBe(TokenType.Ident)
  expect(property.value).toBe('property')
})

test('Multiple statements work', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  expect(node.children.length).toBe(3)
  expect(node.children[0].type).toBe(AbstractSyntaxType.EXPR)
  expect(node.children[1].type).toBe(AbstractSyntaxType.OPERATOR)
  expect(node.children[2].type).toBe(AbstractSyntaxType.EXPR)
})

test('Operator is recorded correctly', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()
  expect(node.children.length).toBe(3)

  // Operator is recorded correctly, wrapped in a node
  const opNode = getASTNode(node, 'children[1]')
  expect(opNode.type).toBe(AbstractSyntaxType.OPERATOR)

  const opToken = getToken(node, 'children[1].children[0]')
  expect(opToken.type).toBe(TokenType.Operator)
  expect(opToken.value).toBe('=')
})

test('Literals are recorded correctly', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  expect(node.children.length).toBe(3)

  // Operator is recorded correctly, wrapped in a node
  expect(node.children[2].type).toBe(AbstractSyntaxType.EXPR)

  const opToken = getToken(node, 'children[2].children[0]')
  expect(opToken.type).toBe(TokenType.String)
  expect(opToken.value).toBe(`"foo"`)
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

// test('we can parse and or statements', () => {
//   const { tokens } = lex('type = "track" or type = "identify"')
//   const { node } = ast(tokens)

//   expect(node.children.length).toBe(3)
//   expect(astToString(node)).toBe('type = "track" or type = "identify"')
// })
