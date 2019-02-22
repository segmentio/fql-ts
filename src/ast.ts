import { Token, t, TokenType } from './token'

export enum AbstractSyntaxType {
  ROOT = 'root',
  EXPR = 'expr',
  PATH = 'path',
  FUNC = 'func',
  ERR = 'err',
  OPERATOR = 'OPERATOR'
}

// Splits children into "leaves" and "nodes" so we get
// type safety and don't have to deal with union types
export interface Node {
  leaves: Token[]
  nodes: Node[]
  type: AbstractSyntaxType
}

function newNode(type: AbstractSyntaxType): Node {
  return { nodes: [], leaves: [], type }
}

export class ParserError extends Error {
  constructor(public message: string) {
    super(message)
    this.name = 'LexerError'
    this.stack = (new Error() as any).stack
  }
}

interface AstResponse {
  node: Node
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

export function astToTokens(node: Node): Token[] {
  const tokens = traverseAstForTokens(node)

  // AST doesn't record the EOS, so we add it back
  tokens.push(t.EOS())

  return tokens
}

export function astToString(node: Node): string {
  return astToTokens(node)
    .map(({ value, type }) => (type === TokenType.EOS ? '' : value))
    .join('')
}

function traverseAstForTokens(node: Node): Token[] {
  let tokens = []

  for (const child of node.nodes) {
    tokens = tokens.concat(traverseAstForTokens(child))
  }

  if (node.leaves.length > 0) {
    tokens = tokens.concat(node.leaves)
  }

  return tokens
}

export class Parser {
  private queue: Token[]

  constructor(tokens: Token[]) {
    this.queue = tokens
  }

  public parse(): Node {
    const node: Node = newNode(AbstractSyntaxType.ROOT)
    node.nodes.push(this.expr())

    if (this.peek().type === TokenType.EOS) {
      return node
    }

    if (this.peek().type === TokenType.Operator) {
      node.nodes.push(this.operator())
      node.nodes.push(this.expr())
      return node
    }

    // Future versions could get better error handling here
    // by passing in the AST up to this point, converting it
    // back to tokens, unlexing those tokens, and then using
    // where it stopped to signal to the user where the bug is
    throw new ParserError(
      `Unexpected token of type '${this.peek().type}' and value '${this.peek().value}'.`
    )
  }

  // We wrap the operator in a node instead
  // of a leaf so we get clear ordering
  private operator(): Node {
    const node: Node = newNode(AbstractSyntaxType.OPERATOR)
    node.leaves.push(this.next())
    return node
  }

  private expr(): Node {
    const node: Node = newNode(AbstractSyntaxType.EXPR)

    const upcoming = this.peek()

    // Strings
    if (upcoming.type === TokenType.String) {
      node.leaves.push(this.next())
      return node
    }

    // Numbers
    if (upcoming.type === TokenType.Number) {
      node.leaves.push(this.next())
      return node
    }

    // Null
    if (upcoming.type === TokenType.Null) {
      node.leaves.push(this.next())
      return node
    }

    // Paths or functions
    if (upcoming.type === TokenType.Ident) {
      node.nodes.push(this.pathOrFunc(this.next()))
      return node
    }

    // Lists
    if (upcoming.type === TokenType.BrackLeft) {
      node.nodes.push(this.list())
      return node
    }

    // Unrecognized tokens
    throw new ParserError(`Unsupported or unrecognized token: ${upcoming}`)
  }

  // things like `message.event` or `contains(...)`
  private pathOrFunc(previous: Token): Node {
    if (this.peek().type === TokenType.ParenLeft) {
      return this.func(previous)
    }

    return this.path(previous)
  }

  private path(previous: Token): Node {
    const node = newNode(AbstractSyntaxType.PATH)
    node.leaves.push(previous)

    while (this.peek().type === TokenType.Ident || this.peek().type === TokenType.Dot) {
      node.leaves.push(this.next())
    }

    return node
  }

  // ident(left, right)
  // nodes = [left, right]; leaves = [ident]
  private func(previous: Token): Node {
    const node = newNode(AbstractSyntaxType.FUNC)
    node.leaves.push(previous) // ident
    node.leaves.push(this.next()) // lparen

    node.nodes.push(this.expr()) // First arg

    // Rest args
    while (this.peek().type !== TokenType.ParenRight) {
      const comma = this.next() // comma
      if (comma.type !== TokenType.Comma) {
        throw new ParserError(`Expected comma in function but got expression: ${comma}`)
      }

      node.nodes.push(this.expr()) // Next expr
    }

    node.leaves.push(this.next()) // rparen

    return node
  }

  private list(): Node {
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
