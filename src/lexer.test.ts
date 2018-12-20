import Lexer from './lexer'
import Token from './token'

test('Lexer returns an EOS on an empty string', () => {
  const lexer = new Lexer('')

  expect(lexer.lex()).toEqual([Token.EOS])
})
