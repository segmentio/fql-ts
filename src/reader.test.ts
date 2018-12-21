import Reader from './reader'

test('A new reader has a 0 position and a set code', () => {
  const reader = new Reader('some text')
  expect(reader.code).toBe('some text')
  expect(reader.getPosition()).toBe(0)
})

test('A reader can read a character and move its position', () => {
  const reader = new Reader('some text')
  const { char, isEOS } = reader.forward()

  // The overall code shouldn't be effected
  expect(reader.code).toBe('some text')

  // The position should be advanced
  expect(reader.getPosition()).toBe(1)

  // The char should be returned
  expect(char).toBe('s')

  // This shouldn't be the EOS
  expect(isEOS).toBeFalsy()
})

test('readers dont get messed up by quotes', () => {
  const reader = new Reader('a"')
  const { char } = reader.forward()
  expect(char).toBe('a')

  const { char: quote, isEOS } = reader.forward()
  expect(quote).toBe('"')
  expect(isEOS).toBe(false)
})

test('readers dont get messed up by spaces', () => {
  const reader = new Reader('a ') // one space afterwards
  const { char } = reader.forward()
  expect(char).toBe('a')

  const { char: space, isEOS } = reader.forward()
  expect(space).toBe(' ')
  expect(isEOS).toBe(false)
})

test('An empty reader will not advance the position', () => {
  const reader = new Reader('')
  const { char, isEOS } = reader.forward()

  expect(isEOS).toBeTruthy()
  expect(char).toBe('')
  expect(reader.getPosition()).toBe(0)
})

test('A reader can read all the characters in a string', () => {
  const reader = new Reader('abc')

  reader.forward() // a
  reader.forward() // b
  const { char, isEOS } = reader.forward() // c

  expect(char).toBe('c')
  expect(isEOS).toBe(false)
})

test('We read a char and then unread a char', () => {
  const reader = new Reader('abc')
  const { char: readChar } = reader.forward() // a
  const { char: unreadChar } = reader.backward() // b

  expect(readChar).toBe('a')
  expect(unreadChar).toBe('b')
})

test('Unreading a char will move the position back', () => {
  const reader = new Reader('abc')

  // Sanity
  expect(reader.getPosition()).toBe(0)

  // Move forward
  reader.forward()
  expect(reader.getPosition()).toBe(1)
  reader.forward()
  expect(reader.getPosition()).toBe(2)

  // Move backwards
  reader.backward()
  expect(reader.getPosition()).toBe(1)
  reader.backward()
  expect(reader.getPosition()).toBe(0)
})

test('Unreading a char too far will throw a rangeError', () => {
  expect(() => {
    const reader = new Reader('a')
    reader.backward()
    reader.backward()
  }).toThrowError(RangeError)
})
