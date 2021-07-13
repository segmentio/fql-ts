<p align="center">
<h2 align="center">FQL (TypeScript)</h2>
</p>
<p align="center">
Language for filtering json streams
<br><br>
</p>

`fql-ts` is a Typescript lexer for [Segment's](https://segment.com) [Filter Query Language](https://segment.com/docs/config-api/fql/) (FQL).

The goal is to allow us to use FQL on the browser and generate React components on top of FQL. It could
also be used to give our FQL in-browser REPLs and integrate into existing tooling.

## Usage

Install it with:

```
yarn add @segment/fql
```

### Lexing

To convert some code into some strings, you can use `lex`:

```js
import { lex } from '@segment/fql'

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
import { types } from '@segment/fql'

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
import { t } from '@segment/fql'

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
  Conditional = 'conditional',
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
t.Conditional('or')
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
import { lex, unlex } from '@segment/fql'

const { tokens } = lex('some.code >= 30')
const { code } = unlex(tokens)

code // 'some.code >= 30' (give or take some whitespace)
```

If we have errors during the unlexing, we'll return an `error` object, just like the lexer.

```js
const { error } = unlex(dangerousErrorTokens)
```

### AST

We can create a typed AST from an array of tokens.

```js
import { ast, lex } from '@segment/fql'

const { tokens } = lex(`message = "foo"`)
const { node } = ast(tokens)
```

The AST returns the _root_ node of the tree which will always have the `node.type` of `ROOT`.

The Tree structure type looks like this:

```ts
{
  children: [],
  type: "expr"
}
```

Leaves are arrays of tokens, nodes are other nodes. The type is an enum defined with `AbstractSyntaxType`. If you're using typescript, they're defined as:

```ts
export enum AbstractSyntaxType {
  ROOT = 'root',
  EXPR = 'expr',
  PATH = 'path',
  FUNC = 'func',
  ERR = 'err',
  CONDITIONAL = 'conditional',
  OPERATOR = 'operator'
}

interface ASTNode {
  children: Array<Token | ASTNode>
  type: AbstractSyntaxType
}

interface Token {
  type: TokenType
  value: string
}
```

#### Errors

If something went wrong in the parsing, the AST will return an error and the last node will be of type `ERR`:

```js
import { ast, lex } from '@segment/fql'

const { tokens } = lex(`message = `)
const { node, error } = ast(tokens)

console.error(error) // "ParserError: ..."
```

#### All Tokens are wrapped by a Node

For consistency and parsing reasons, *there are no heterogenous children on nodes.* In other words, a node NEVER has BOTH a token and another node as a children.

This is impossible in FQL-TS:
```
// BAD
node
 - token 
 - node
   - token
```

Instead, tokens are wrapped in their own node:
```
// GOOD
node 
 - node
   - token
 - node
   - token
```

This is incredibly important to note in `conditional` (like "and" and "or") and `operator` nodes, as it's often easy to assume that FQL like `message.event = "foo"` might look like this:

```
// BAD
node(expr)
  - node(path)
    - ...
  - token('=')
  - node(string)
    - ...
```

Instead, we'd see something like this:
```
// GOOD
node(expr)
  - node(path)
    - ...
  - node(operator)
    - token('=')
  - node(string)
    - ...
```

#### There and Back Again

You can go from an AST to tokens pretty easily with `astToTokens`:

```js
import { astToTokens, lex, ast } from '@segment/fql'

const { tokens } = lex(`message = "foo"`)
const { node } = ast(tokens)

astToTokens(node) // same thing as tokens
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

## License

MIT License

Copyright (c) 2021 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
