export interface Token {
  type: TokenType
  value: string
}

// Loosely checks if something is a token type at runtime
export function isToken(arg: any): arg is Token {
  return (arg as Token).type !== undefined && typeof (arg as Token).value === 'string'
}

// All available tokens forms
export enum TokenType {
  Err = 'err',
  Ident = 'ident',
  Dot = 'dot',
  Operator = 'operator',
  Conditional = 'conditional',
  String = 'string',
  Number = 'number',
  Null = 'null',
  BrackLeft = 'brackleft',
  BrackRight = 'brackright',
  ParenLeft = 'parenleft',
  ParenRight = 'parenright',
  Comma = 'comma',
  EOS = 'eos'
}

// Helper functions for creating typed Tokens
export const t = {
  Err: (): Token => {
    return { type: TokenType.Err, value: 'err' }
  },

  Ident: (value): Token => {
    return { type: TokenType.Ident, value }
  },

  Dot: (): Token => {
    return { type: TokenType.Dot, value: '.' }
  },

  Operator: (value): Token => {
    return { type: TokenType.Operator, value }
  },

  Conditional: (value): Token => {
    return { type: TokenType.Conditional, value }
  },

  String: (value): Token => {
    return { type: TokenType.String, value }
  },

  Number: (value): Token => {
    return { type: TokenType.Number, value }
  },

  Null: (): Token => {
    return { type: TokenType.Null, value: 'null' }
  },

  BrackLeft: (): Token => {
    return { type: TokenType.BrackLeft, value: '[' }
  },

  BrackRight: (): Token => {
    return { type: TokenType.BrackRight, value: ']' }
  },

  ParenLeft: (): Token => {
    return { type: TokenType.ParenLeft, value: '(' }
  },

  ParenRight: (): Token => {
    return { type: TokenType.ParenRight, value: ')' }
  },

  Comma: (): Token => {
    return { type: TokenType.Comma, value: ',' }
  },

  EOS: (): Token => {
    return { type: TokenType.EOS, value: 'eos' }
  }
}
