import { get } from 'lodash'
import { ASTNode, ASTree } from './ast'
import { Token } from './token'

// Assertively get a child as an ASTNode
export function getASTNode(arg: ASTree, path: string): ASTNode {
  return get(arg, path)
}

// Assertively get a child as a Token
export function getToken(arg: ASTree, path: string): Token {
  return get(arg, path)
}
