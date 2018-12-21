import { isNumber } from './strings'

test('no for weird js number cases', () => {
  // Definitely numbers
  expect(isNumber('0')).toBe(true)
  expect(isNumber('1')).toBe(true)

  // NaN
  expect(isNumber(' ')).toBe(false)
  expect(isNumber('true')).toBe(false)
  expect(isNumber('Infinity')).toBe(false)
  expect(isNumber(',')).toBe(false)
})
