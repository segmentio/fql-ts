import Reader from './reader'

test('A new reader has a 0 position and a set code', () => {
  const reader = new Reader('some text')
  expect(reader.code).toBe('some text')
  expect(reader.getPosition()).toBe(0)
})

test('A reader can read a character and move its position', () => {
  const reader = new Reader('some text')
  const { char, isEOS } = reader.readChar()

  // The overall code shouldn't be effected
  expect(reader.code).toBe('some text')

  // The position should be advanced
  expect(reader.getPosition()).toBe(1)

  // The char should be returned
  expect(char).toBe('s')

  // This shouldn't be the EOS
  expect(isEOS).toBeFalsy()
})

test('An empty reader will not advance the position', () => {
  const reader = new Reader('')
  const { char, isEOS } = reader.readChar()

  expect(isEOS).toBeTruthy()
  expect(char).toBe('')
  expect(reader.getPosition()).toBe(0)
})

test('A reader can read all the characters in a string', () => {
  const reader = new Reader('abc')

  reader.readChar() // a
  reader.readChar() // b
  const { char, isEOS } = reader.readChar() // c

  expect(char).toBe('c')
  expect(isEOS).toBe(false)
})

test('We read a char and then unread a char', () => {
  const reader = new Reader('abc')
  const { char: readChar } = reader.readChar() // a
  const { char: unreadChar } = reader.unreadChar() // b

  expect(readChar).toBe('a')
  expect(unreadChar).toBe('b')
})

test('Unreading a char will move the position back', () => {
  const reader = new Reader('abc')

  // Sanity
  expect(reader.getPosition()).toBe(0)

  // Move forward
  reader.readChar()
  expect(reader.getPosition()).toBe(1)
  reader.readChar()
  expect(reader.getPosition()).toBe(2)

  // Move backwards
  reader.unreadChar()
  expect(reader.getPosition()).toBe(1)
  reader.unreadChar()
  expect(reader.getPosition()).toBe(0)
})

test('Unreading a char too far will throw a rangeError', () => {
  expect(() => {
    const reader = new Reader('a')
    reader.unreadChar()
    reader.unreadChar()
  }).toThrowError(RangeError)
})
