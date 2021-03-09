import ast, { AbstractSyntaxType, astToTokens, astToString, isASTNode, ASTNode } from './ast'
import lex from './lexer'
import { TokenType, Token, t } from './token'
import { get } from 'lodash'

// Assertively get a child as an ASTNode
function getASTNode(arg: ASTNode, path: string): ASTNode {
  return get(arg, path)
}

// Assertively get a child as a Token
function getToken(arg: ASTNode, path: string): Token {
  return get(arg, path)
}

test('root node has root type', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.type).toBe(AbstractSyntaxType.ROOT)
})

test('in a single statement context the first child is a statement', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)

  expect(node.children[0].type).toBe(AbstractSyntaxType.STATEMENT)
})

test('second node has expr type', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)
  const statement = node.children[0] as ASTNode

  expect(statement.children.length).toBe(1)
  expect(statement.children[0].type).toBe(AbstractSyntaxType.EXPR)
})

test('string types are recognized', () => {
  const { tokens } = lex(`"foobang"`)
  const { node } = ast(tokens)
  const statement = node.children[0] as ASTNode

  const expr = statement.children[0]
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
  const statement = node.children[0] as ASTNode

  const expr = statement.children[0]
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
  const statement = node.children[0] as ASTNode

  const expr = statement.children[0]
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
  const statement = node.children[0] as ASTNode

  // expr -> path -> token[0]
  const token = getToken(statement, 'children[0].children[0].children[0]')
  expect(token.type).toBe(TokenType.Ident)
  expect(token.value).toBe('message')
})

test('multi paths are recognized', () => {
  const { tokens } = lex(`message.event.property`)
  const { node } = ast(tokens)

  const statement = node.children[0] as ASTNode

  const path = getASTNode(statement, 'children[0].children[0]')
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

  const statement = node.children[0] as ASTNode

  expect(statement.children.length).toBe(3)
  expect(statement.children[0].type).toBe(AbstractSyntaxType.EXPR)
  expect(statement.children[1].type).toBe(AbstractSyntaxType.OPERATOR)
  expect(statement.children[2].type).toBe(AbstractSyntaxType.EXPR)
})

test('Operator is recorded correctly', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  const statement = node.children[0] as ASTNode
  expect(statement.children.length).toBe(3)

  // Operator is recorded correctly, wrapped in a node
  const opNode = getASTNode(statement, 'children[1]')
  expect(opNode.type).toBe(AbstractSyntaxType.OPERATOR)

  const opToken = getToken(statement, 'children[1].children[0]')
  expect(opToken.type).toBe(TokenType.Operator)
  expect(opToken.value).toBe('=')
})

test('Literals are recorded correctly', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  const statement = node.children[0] as ASTNode
  expect(statement.children.length).toBe(3)

  // Operator is recorded correctly, wrapped in a node
  expect(statement.children[2].type).toBe(AbstractSyntaxType.EXPR)

  const opToken = getToken(statement, 'children[2].children[0]')
  expect(opToken.type).toBe(TokenType.String)
  expect(opToken.value).toBe(`"foo"`)
})

test('astToTokens can correctly convert to tokens', () => {
  const { tokens } = lex(`message = "foo"`)
  const { node } = ast(tokens)

  expect(astToTokens(node)).toEqual(tokens)
})

test('astToTokens correctly handles functions', () => {
  const { tokens } = lex(`contains("Kelly", "Kel")`)
  const { node } = ast(tokens)

  expect(astToTokens(node)).toEqual(tokens)
})

test('astToTokens correctly handles functions with paths', () => {
  const { tokens } = lex(`contains(properties.foo.bar.baz, "Kel")`)
  const { node } = ast(tokens)

  expect(astToTokens(node)).toEqual(tokens)
})

test('astToString can correctly convert tokens', () => {
  const { tokens } = lex('message.event')
  const { node } = ast(tokens)

  expect(astToString(node)).toBe('message.event')
})

test('astToString correctly handles functions', () => {
  const { tokens } = lex(`contains("Kelly", "Kel")`)
  const { node } = ast(tokens)

  expect(astToString(node)).toEqual(`contains("Kelly","Kel")`)
})

test('astToString correctly handles functions with paths', () => {
  const { tokens } = lex(`contains(event.foo.bar.baz, "Kel")`)
  const { node } = ast(tokens)

  expect(astToString(node)).toEqual(`contains(event.foo.bar.baz,"Kel")`)
})

test('we can find `or` conditionals', () => {
  const { tokens } = lex('type = "track" or type = "identify"')
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  // <statement> <conditional> <statement>
  expect(node.children.length).toBe(3)
  expect(node.children[0].type).toBe(AbstractSyntaxType.STATEMENT)
  expect(node.children[1].type).toBe(AbstractSyntaxType.CONDITIONAL)
  expect(node.children[2].type).toBe(AbstractSyntaxType.STATEMENT)

  const conditional = getToken(node, 'children[1].children[0]')
  expect(conditional).toEqual(t.Conditional('or'))
})

test('we can find `and` conditionals', () => {
  const { tokens } = lex('type = "track" and type = "identify"')
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  // <statement> <conditional> <statement>
  expect(node.children.length).toBe(3)
  expect(node.children[0].type).toBe(AbstractSyntaxType.STATEMENT)
  expect(node.children[1].type).toBe(AbstractSyntaxType.CONDITIONAL)
  expect(node.children[2].type).toBe(AbstractSyntaxType.STATEMENT)

  const conditional = getToken(node, 'children[1].children[0]')
  expect(conditional).toEqual(t.Conditional('and'))
})

test('we can find many part statements', () => {
  const { tokens } = lex(
    `type = "track" and type = "identify" or foo = "dogs" and cats = "bloop" or type = "apples"`
  )
  const { node, error } = ast(tokens)
  expect(error).toBeUndefined()

  // <statement> <cond> <statement> <cond> <statement> <cond> <statement> <cond> <statement>
  expect(node.children.length).toBe(9)
  const types = node.children.map(({ type }) => type)
  expect(types).toEqual([
    AbstractSyntaxType.STATEMENT,
    AbstractSyntaxType.CONDITIONAL,
    AbstractSyntaxType.STATEMENT,
    AbstractSyntaxType.CONDITIONAL,
    AbstractSyntaxType.STATEMENT,
    AbstractSyntaxType.CONDITIONAL,
    AbstractSyntaxType.STATEMENT,
    AbstractSyntaxType.CONDITIONAL,
    AbstractSyntaxType.STATEMENT
  ])
})

test('We can convert conditional statements from ast nodes back to strings', () => {
  const { tokens } = lex('type = "track" or type = "identify"')
  const { node } = ast(tokens)

  expect(node.children.length).toBe(3)
  expect(astToString(node)).toBe('type = "track" or type = "identify"')
})

const ConditionalStatementTests = [
  `contains("Evan Conrad", "Evan") and event = "foo"`,
  `contains("Evan Conrad", "Evan") or event = "foo"`,
  `event = "foo" and contains("Evan Conrad", "Evan")`,
  `event = "foo" or contains("Evan Conrad", "Evan")`,
]

ConditionalStatementTests.forEach(fql => {
  test(`conditional statement with function: ${fql}`, () => {
    const { tokens, error } = lex(fql)
    expect(error).toBeUndefined()

    const { error: secondError } = ast(tokens)
    expect(secondError).toBeUndefined()
  })
})

const SupportedFunctions = [
  {
    expression: 'contains("evan conrad", "evan")',
    assertion: (node: ASTNode) => {
      const [contains, testString, substring] = get(node, 'children[0].children[0].children[0].children')
      expect(contains).toEqual({ type: 'ident', value: 'contains' })
      expect(testString).toEqual(
        {
          'children': [
            {
              'type': 'string',
              'value': '\"evan conrad\"'
            }
          ],
          'type': 'expr'
        }
      )
      expect(substring).toEqual(
        {
          'children': [
            {
              'type': 'string',
              'value': '\"evan\"'
            }
          ],
          'type': 'expr'
        }
      )
    }
  },
  {
    expression: 'contains(event, "Completed")',
    assertion: (node: ASTNode) => {
      const [contains, event, completed] = get(node, 'children[0].children[0].children[0].children')
      expect(contains).toEqual({ type: 'ident', value: 'contains' })
      expect(event).toEqual({
        'children': [
          {
            'children': [
              {
                'type': 'ident',
                'value': 'event'
              }
            ],
            'type': 'path'
          }
        ],
        'type': 'expr'
      })
      expect(completed).toEqual(
        {
          'children': [
            {
              'type': 'string',
              'value': '\"Completed\"'
            }
          ],
          'type': 'expr'
        }
      )
    }
  },
  {
    expression: 'contains(event.userId, "sloth")',
    assertion: (node: ASTNode) => {
      const [contains, eventUserId, sloth] = get(node, 'children[0].children[0].children[0].children')
      expect(contains).toEqual({ type: 'ident', value: 'contains' })
      expect(eventUserId).toEqual(
        {
          'children': [
            {
              'children': [
                {
                  'type': 'ident',
                  'value': 'event'
                },
                {
                  'type': 'dot',
                  'value': '.'
                },
                {
                  'type': 'ident',
                  'value': 'userId'
                }
              ],
              'type': 'path'
            }
          ],
          'type': 'expr'
        }
      )
      expect(sloth).toEqual(
        {
          'children': [
            {
              'type': 'string',
              'value': '\"sloth\"'
            }
          ],
          'type': 'expr'
        }
      )
    }
  },
  {
    expression: 'match("peter richmond", "peter*")',
    assertion: (node: ASTNode) => {
      const [match, testString, substring] = get(node, 'children[0].children[0].children[0].children')
      expect(match).toEqual({ type: 'ident', value: 'match' })
      expect(testString).toEqual(
          {
            'children': [
              {
                'type': 'string',
                'value': '\"peter richmond\"'
              }
            ],
            'type': 'expr'
          }
      )
      expect(substring).toEqual(
          {
            'children': [
              {
                'type': 'string',
                'value': '\"peter*\"'
              }
            ],
            'type': 'expr'
          }
      )
    }
  },
  {
    expression: 'match(username, "peter*")',
    assertion: (node: ASTNode) => {
      const [match, username, peterGlob] = get(node, 'children[0].children[0].children[0].children')
      expect(match).toEqual({ type: 'ident', value: 'match' })
      expect(username).toEqual({
        'children': [
          {
            'children': [
              {
                'type': 'ident',
                'value': 'username'
              }
            ],
            'type': 'path'
          }
        ],
        'type': 'expr'
      })
      expect(peterGlob).toEqual(
          {
            'children': [
              {
                'type': 'string',
                'value': '\"peter*\"'
              }
            ],
            'type': 'expr'
          }
      )
    }
  },
  {
    expression: 'match(username.sha64, "peter*")',
    assertion: (node: ASTNode) => {
      const [match, usernameSha64, peterGlob] = get(node, 'children[0].children[0].children[0].children')
      expect(match).toEqual({ type: 'ident', value: 'match' })
      expect(usernameSha64).toEqual(
          {
            'children': [
              {
                'children': [
                  {
                    'type': 'ident',
                    'value': 'username'
                  },
                  {
                    'type': 'dot',
                    'value': '.'
                  },
                  {
                    'type': 'ident',
                    'value': 'sha64'
                  }
                ],
                'type': 'path'
              }
            ],
            'type': 'expr'
          }
      )
      expect(peterGlob).toEqual(
          {
            'children': [
              {
                'type': 'string',
                'value': '\"peter*\"'
              }
            ],
            'type': 'expr'
          }
      )
    }
  }
]

SupportedFunctions.forEach(({ expression, assertion }) => {
  test(`it works for ${expression}`, () => {
    const { tokens, error } = lex(expression)
    expect(error).toBeUndefined()

    const { node, error: error2 } = ast(tokens)
    expect(error2).toBeUndefined()

    assertion(node)
  })
})

const UnsupportedFunctions = [
  {
    functionName: 'length',
    expression: 'length("blah")'
  },
  {
    functionName: 'lowercase',
    expression: 'lowercase("WHYYYYY")'
  },
  {
    functionName: 'typeof',
    expression: 'typeof("pikachu")'
  },
  {
    functionname: 'random',
    expression: 'random(50)'
  }
]

UnsupportedFunctions.forEach(({ expression }) => {
  test(`it doesn't work with ${expression}`, () => {
    const { tokens, error } = lex(expression)
    const { error: secondError } = ast(tokens)
    expect(error || secondError).toBeTruthy()
  })
})
