import { t, isToken } from './token'

test('isToken will check if something is a token', () => {
  expect(isToken(t.Dot())).toBeTruthy()

  expect(isToken({})).toBeFalsy()
  expect(isToken([])).toBeFalsy()
  expect(isToken('cats')).toBeFalsy()
})
