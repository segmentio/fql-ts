import get from 'lodash/get'
import { ASTNode } from './ast'
import { Token } from './token'

// Assertively get a child as an ASTNode
export function getASTNode(arg: ASTNode, path: string): ASTNode {
  return get(arg, path)
}

// Assertively get a child as a Token
export function getToken(arg: ASTNode, path: string): Token {
  return get(arg, path)
}
