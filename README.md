<p align="center">
<h2 align="center">FQL (TypeScript)</h2>
</p>
<p align="center">
Language for filtering json streams
<br><br>
</p>

`fql-ts` is a Typescript lexer for [Segment's](https://segment.com) [Filter Query Language](https://github.com/segmentio/fql) (FQL).

The goal is to allow us to use FQL on the browser and generate React components on top of FQL. It could
also be used to give our FQL in-browser REPLs and integrate into existing tooling.

## Usage

### Lexing

To convert some code into some strings, you can use `lex`:

```js
import { lex } from '@segmentio/fql'

const { tokens } = lex('message.event > 30')
```

If some thing goes wrong lexing you'll get an `error` that you could surface to the user.

```js
const { error } = lex('message.event > 30.30.30')

error.cursor.line // 0
error.cursor.column // 22
error.message // 'multiple decimal points in one number'
```

### Tokens

In `fql-ts`, a token is an object with a `value` and an enum `type`.

For example, a string like `"Order Completed"` has a token that looks like this:

```js
import { types } from '@segmentio/fql'

{
    type: types.String,
    value: "Order Completed"
}
```

Some tokens don't have a unique value, so theirs is set to the name of the
token. This is helpful for when we want to "unlex" or convert tokens back to strings.

```js
{
    type: types.Comma,
    value: ","
}
```

But `fql-ts` also comes with helper functions to create tokens. We can create
that same String token with:

```js
import { t } from '@segmentio/fql'

t.String('"Order Completed"')
```

Likewise, tokens that don't need values don't need string inputs in their helper
functions:

```js
t.Comma()
```

Below is the full list of token types. There's a corresponding helper for each of
them as well.

```ts
// types
enum TokenType {
  Err = 'err',
  Ident = 'ident',
  Dot = 'dot',
  Operator = 'operator',
  String = 'string',
  Number = 'number',
  Null = 'null',
  BrackLeft = 'brackleft',
  BrackRight = 'brackright',
  ParenLeft = 'parenleft',
  ParenRight = 'parenright',
  Comma = 'comma',
  EOS = 'eos' // End of statement (the final token)
}

// example helpers
t.Err()
t.Ident('someIdentifier')
t.Dot()
t.Operator('=')
t.String('"Something Something Something"') // note the extra "" quotes here
t.Number('23') // Still needs to be a string
t.Null()
t.BrackLeft()
t.BrackRight()
t.ParenLeft()
t.ParenRight()
t.Comma()
t.EOS()
```

### Unlexing

If you can lex, can you un-lex? Why of course! `fql-ts` comes with full
support for turning tokens back into code.

This is pretty helpful for _generating_ FQL code, either through UI pieces
or programatically.

```js
import { lex, unlex } from '@segmentio/fql'

const { tokens } = lex('some.code >= 30')
const { code } = unlex(tokens)

code // 'some.code >= 30' (give or take some whitespace)
```

If we have errors during the unlexing, we'll return an `error` object, just like the lexer.

```js
const { error } = unlex(dangerousErrorTokens)
```

## Contributing

Install the dependencies!

```sh
yarn
```

Run the tests!

```sh
yarn test --coverage
```

Create a build!

```sh
yarn build
```
