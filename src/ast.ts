import { Token, t, TokenType, isToken } from './token'

export enum AbstractSyntaxType {
  ROOT = 'root',
  EXPR = 'expr',
  PATH = 'path',
  FUNC = 'func',
  ERR = 'err',
  OPERATOR = 'operator',
  CONDITIONAL = 'conditional',
  STATEMENT = 'statement'
}

// Splits children into "leaves" and "nodes" so we get
// type safety and don't have to deal with union types
export interface ASTNode {
  children: Array<Token | ASTNode>
  type: AbstractSyntaxType
}

export function isASTree(arg: any): arg is ASTNode {
  return isASTNode(arg) || isToken(arg)
}

export function isASTNode(arg: any): arg is ASTNode {
  return (arg as ASTNode).children !== undefined
}

function newNode(type: AbstractSyntaxType): ASTNode {
  return { children: [], type }
}

export class ParserError extends Error {
  constructor(public message: string) {
    super(message)
    this.name = 'LexerError'
    this.stack = (new Error() as any).stack
  }
}

interface AstResponse {
  node: ASTNode
  error?: Error
}

export default function ast(tokens: Token[]): AstResponse {
  try {
    // we .slice() here to avoid destroying the array
    return { node: new Parser(tokens.slice()).parse() }
  } catch (error) {
    return {
      node: newNode(AbstractSyntaxType.ERR),
      error
    }
  }
}

export function astToTokens(node: ASTNode): Token[] {
  const tokens = traverseAstForTokens(node)

  // AST doesn't record the EOS, so we add it back
  tokens.push(t.EOS())

  return tokens
}

function formatToken(token: Token): string {
  switch (token.type) {
    case TokenType.EOS:
      return '' // don't show EOS tokens
    case TokenType.Conditional:
      // 'or' and 'and' needs spaces to avoid converting things to:
      // `ortype = "hello"` instead of `or type = "hello"`
      return ' ' + token.value + ' '
    case TokenType.Operator:
      // Operators are formatted with spaces for easier reading
      // prefer `type = "hello"` to `type="hello"`
      return ' ' + token.value + ' '
    default:
      return token.value
  }
}

export function astToString(node: ASTNode): string {
  return astToTokens(node)
    .map(formatToken)
    .join('')
}

function traverseAstForTokens(tree: ASTNode): Token[] {
  let tokens = []

  for (const child of tree.children) {
    if (isASTNode(child)) {
      tokens = tokens.concat(traverseAstForTokens(child))
    } else if (isToken(child)) {
      tokens.push(child)
    }
  }

  return tokens
}

export class Parser {
  private queue: Token[]

  constructor(tokens: Token[]) {
    this.queue = tokens
  }

  public parse(): ASTNode {
    const node: ASTNode = newNode(AbstractSyntaxType.ROOT)
    node.children.push(this.statement())

    while (this.peek().type === TokenType.Conditional || this.peek().type === TokenType.EOS) {
      if (this.peek().type === TokenType.EOS) {
        return node
      }

      node.children.push(this.conditional())
      node.children.push(this.statement())
    }

    // Future versions could get better error handling here
    // by passing in the AST up to this point, converting it
    // back to tokens, unlexing those tokens, and then using
    // where it stopped to signal to the user where the bug is
    throw new ParserError(
      `Unexpected token of type '${this.peek().type}' and value '${this.peek().value}'.`
    )
  }

  private statement(): ASTNode {
    const node: ASTNode = newNode(AbstractSyntaxType.STATEMENT)
    node.children.push(this.expr())

    if (this.peek().type === TokenType.EOS) {
      return node
    }

    if (this.peek().type === TokenType.Operator) {
      node.children.push(this.operator())
      node.children.push(this.expr())
      return node
    }

    throw new ParserError(`Unexpected token in statement: '${this.peek()}'`)
  }

  // Wrapped in a leaf so we get a clear ordering
  // when parsing
  private conditional(): ASTNode {
    const node: ASTNode = newNode(AbstractSyntaxType.CONDITIONAL)
    node.children.push(this.next())
    return node
  }

  // We wrap the operator in a node instead
  // of a leaf so we get clear ordering
  private operator(): ASTNode {
    const node: ASTNode = newNode(AbstractSyntaxType.OPERATOR)
    node.children.push(this.next())
    return node
  }

  private expr(): ASTNode {
    const node: ASTNode = newNode(AbstractSyntaxType.EXPR)

    const upcoming = this.peek()

    // Strings
    if (upcoming.type === TokenType.String) {
      node.children.push(this.next())
      return node
    }

    // Numbers
    if (upcoming.type === TokenType.Number) {
      node.children.push(this.next())
      return node
    }

    // Null
    if (upcoming.type === TokenType.Null) {
      node.children.push(this.next())
      return node
    }

    // Paths or functions
    if (upcoming.type === TokenType.Ident) {
      node.children.push(this.pathOrFunc(this.next()))
      return node
    }

    // Lists
    if (upcoming.type === TokenType.BrackLeft) {
      node.children.push(this.list())
      return node
    }

    // Unrecognized tokens
    throw new ParserError(`Unsupported or unrecognized token: ${upcoming}`)
  }

  // things like `message.event` or `contains(...)`
  private pathOrFunc(previous: Token): ASTNode {
    const nextToken = this.peek()

    if (nextToken.type === TokenType.ParenLeft) {
      return this.func(previous)
    }

    return this.path(previous)
  }

  private path(previous: Token): ASTNode {
    const node = newNode(AbstractSyntaxType.PATH)
    node.children.push(previous)

    while (this.peek().type === TokenType.Ident || this.peek().type === TokenType.Dot) {
      node.children.push(this.next())
    }

    return node
  }

  private func(previous: Token): ASTNode {
    const supportedFuncs: string[] = ['contains', 'match']

    if (!(previous.type === 'ident' && supportedFuncs.indexOf(previous.value) !== -1)) {
      throw new Error(`Function not supported: ${previous.value}`)
    }

    const node: ASTNode = newNode(AbstractSyntaxType.FUNC)
    node.children.push(previous)

    const leftParens = this.next()
    if (leftParens.type !== TokenType.ParenLeft) {
      throw new Error(`Unexpected token in function: "${leftParens.value}"`)
    }

    const testString = this.next()
    if (testString.type !== TokenType.String) {
      throw new Error(`Unexpected token in function: "${testString.value}"`)
    }

    node.children.push(testString)

    const comma = this.next()
    if (comma.type !== TokenType.Comma) {
      throw new Error(`Unexpected token in function: "${comma.value}"`)
    }

    const substring = this.next()
    if (testString.type !== TokenType.String) {
      throw new Error(`Unexpected token in function: "${substring.value}"`)
    }

    node.children.push(substring)

    const rightParens = this.next()
    if (rightParens.type !== TokenType.ParenRight) {
      throw new Error(`Unexpected token in function: ${rightParens.value}`)
    }

    return node
  }

  private list(): ASTNode {
    throw new ParserError(` list Not yet supported`)
  }

  private peek(): Token {
    if (this.queue.length > 0) {
      return this.queue[0]
    }

    return t.EOS()
  }

  private next(): Token {
    const upcoming = this.peek()
    if (upcoming.type !== TokenType.EOS) {
      return this.queue.shift()
    }
    return t.EOS()
  }
}
