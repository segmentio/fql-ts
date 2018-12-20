import Reader from "./reader";

test("A new reader has a 0 position and a set code", () => {
  const reader = new Reader("some text");
  expect(reader.code).toBe("some text");
  expect(reader.position).toBe(0);
});

test("A reader can read a character and move its position", () => {
  const reader = new Reader("some text");
  const { char, isEOS } = reader.readChar();

  // The overall code shouldn't be effected
  expect(reader.code).toBe("some text");

  // The position should be advanced
  expect(reader.position).toBe(1);

  // The char should be returned
  expect(char).toBe("s");

  // This shouldn't be the EOS
  expect(isEOS).toBeFalsy();
});

test("An empty reader will not advance the position", () => {
  const reader = new Reader("");
  const { char, isEOS } = reader.readChar();

  expect(isEOS).toBeTruthy();
  expect(char).toBe("");
  expect(reader.position).toBe(0);
});

test("A reader can read all the characters in a string", () => {
  const reader = new Reader("abc");

  reader.readChar(); // a
  reader.readChar(); // b
  const { char, isEOS } = reader.readChar(); // c

  expect(char).toBe("c");
  expect(isEOS).toBe(false);
});
