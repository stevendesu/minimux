# Minimux #

>A minimalist state management library (inspired by Redux)
>
>v2.0.1
>
>Copyright 2016 Steven Barnett (stevendesu)

## Table of Contents ##

 - [Description](#description)
 - [Deprecated Features](#deprecated-features)
 - [Requirements](#requriements)
 - [Installation](#installation)
 - [Usage](#usage)
 - [Using React Middleware](#using-react-middleware)
 - [Why Not Redux?](#why-not-redux)
 - [Ideology](#ideology)
 - [Extending Minimux](#extending-minimux)
 - [Contributin'](#contributin)
 - [License](#license)


## Description ##

Minimux was invented because I liked the ideology of Redux, but not the
implementation. This is my attempt to rebuild Redux with absolute minimal
functionality and to allow for absolute minimal boilerplate in order to write
effective code.

Minimux is effectively built from two major components:

 - A store for holding the current (immutable) state, which will broadcast
   to callbacks when the state changes
 - A middleware-wrapped state modifier using actions and reducers like Redux


All of this for just **545 bytes minified and gzipped**

## Deprecated Features ##

These are features which are no longer supported and will be removed in the
next major version of Minimux. If you use any of these features, you may want
to modify your code to no longer depend on them.

**No features deprecated yet as of v2.0.1**

## Requirements ##

Minimux has absolutely no requirements. You can import it into your project and
start using it without any additional node modules, without any external code,
and without any hassle!

## Installation ##

The easiest way to get started with Minimux is using NPM:

```
npm install --save minimux
```

After this, you can include Minimux as necessary in your project:

```js
import * from 'minimux';
```

See [Usage](#usage) for further details on importing.

If you wish to utilize Minimux on a website without using NPM, that's fine,
too! Minimux is built using Browserify, so in theory it should load if you
include `minimux.js` or `minimux.min.js` on your page with a `<script>` tag:

```html
<script type="text/javascript" src="/path/to/minimux.min.js"></script>
```

It is recommended that if you use `minimux.min.js` you also host
`minimux.min.js.map` in the same directory to enable source maps for easier
debugging.

Browserify also wrapped Minimux in some crazy header which I think is UMD? It
may just be CommonJS or AMD, though. Sorry, I haven't really tested the
`<script>` tag usage.

## Usage ##

**Actions:**

```jsx
// ./actions/index.js
import { dispatch } from 'minimux';

export function myAction() {
	dispatch({ type: 'MY_ACTION' });
}

export function actionWithParams(params) {
	// Currying allows params to be passed at render-time but processed at event-time
	return function() {
		dispatch({ type: 'PARAMS_ACTION', params: params });
	}
}

// ./components/my-component.jsx
import React from 'react';
import { myAction, actionWithParams } from '../actions';

class MyComponent extends React.Component {
	render() {
		return <input onKeyPress={myAction} onChange={actionWithParams('asdf')} />;
	}
}
```

**Reducers:**

```jsx
import { register } from 'minimux';

register('MY_ACTION', function(state, action) {
	return { value: state.value + 1 };
});

register('PARAMS_ACTION', function(state, action) {
	return { value: action.params };
});
```

**Callbacks:**

```jsx
import { listen, unlisten } from 'minimux';

var myListener = function(state) {
	console.log(state);
};

listen(myListener);
unlisten(myListener);

// If you never plan to unlisten:
listen(function(state) {
	console.log(state);
});
```

**Middleware:**

```jsx
import { use } from 'minimux';

use(function(action, nextLayer) {
	// Modify the action here for "pre" middleware
	if(action.type == 'PARAMS_ACTION') { action.params = 'neat'; }
	let state = nextLayer(action);
	// Modify the state here for "post" middleware
	// Note: middleware is allowed to directly modify state
	state.value += 7;
	return state;
});
```

## Using React Middleware ##

To simplify using Minimux with React, it comes packaged with middleware
specifically for binding to React components.

```jsx
import { reactMiddleware } from 'minimux/middleware';
// Alternative: import reactMiddleware from 'minimux/middleware/react';

import { use } from 'minimux';

use(reactMiddleware(ReactDOM.render(<App />, container)));
```

In order for the reactMiddleware to properly wire to the component it must be
a class-based component. Functional components do not return anything from
`ReactDOM.render()` and so there is no way to force them to re-render.

## Why Not Redux? ##

If you're already using Redux, by all means: don't stop. It's a great library!

While working with React-Redux I found a few features of the API that I didn't
like. To name a few:

 - Despite the docs saying you should **never** call `createStore` more than
   once, nothing prevented it.
 - Binding more than one reducer necessitated a strange "combining" function.
 - Middleware was defined using a function which called a function which called
   a function.
 - React-Redux required two functions for mapping state and actions separately,
   and introduced a `<Provider>` component


I built my library organically adding features only as necessary and attempting
to minimize the amount of code necessary to utilize those features. This "avoid
boilerplate at all costs" mentality led to Minimux.

## Ideology ##

There are three guiding principles behind Redux:

 1. Single source of truth
 2. State is read-only
 3. Changes are made with pure functions


Each of these principles, you'll notice, has nothing to do with the Redux
library in particular. They are a set of best-practices that can be followed by
any code base without the need of an external library. All you need to do is
ensure that:

 1. You only have one global "state" object
 2. You overwrite the state with a new "state" object when it's modified
 3. All modifications are done through "reducers"


My library attempts to adhere to this ideology with one additional parameter:
**maximize the signal-to-noise ratio by minimizing boilerplate**

Consider the following using React-Redux:

```jsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware, bindActionCreators } from 'redux';

// Reducer
const reducer = (state = 0, action) => {
	switch (action.type) {
		case 'INCREMENT':
			return state + 1;
		case 'DECREMENT':
			return state - 1;
		default:
			return state;
	}
}

// Store
const store = createStore(reducer);

// Actions
const increment = () => {
	store.dispatch({ type: 'INCREMENT' });
}
const decrement = () => {
	store.dispatch({ type: 'DECREMENT' });
}

// Containers
class Counter extends Component {
	render() {
		return <ActualCounter value={this.props.value} onIncrement={this.props.increment} onDecrement={this.props.decrement} />;
	}
}
const mapStateToProps = (state) => {
	return {
		value: state
	};
}
const mapDispatchToProps = (dispatch) => {
	return bindActionCreators({ increment: increment, decrement: decrement }, dispatch);
}
let CounterContainer = connect(mapStateToProps, mapDispatchToProps)(Counter);

// Components
class ActualCounter extends Component {
	render() {
		return (
			<div>
				<button onClick={this.props.onIncrement}>+</button>
				<button onClick={this.props.onDecrement}>-</button>
				<p>{this.props.value}</p>
			</div>
		);
	}
}

// Render it all
ReactDOM.render(<Provider store={store}><CounterContainer /></Provider>, document.getElementById("container"));
```

Holy **crap** that was a mouthful. In total that's 59 lines of code.

Now let's do the same thing in Minimux:

```jsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { register, dispatch, getState, use } from 'minimux';
import { reactMiddleware } from 'minimux/middleware';

// Reducers
register('INCREMENT', (state, action) => {
	return { count: state.count + 1 };
});
register('DECREMENT', (state, action) => {
	return { count: state.count + 1 };
});

// Actions
const increment = () => {
	dispatch({ type: 'INCREMENT' });
}
const decrement = () => {
	dispatch({ type: 'DECREMENT' });
}

// Components
class Counter extends Component {
	render() {
		return (
			<div>
				<button onClick={increment}>+</button>
				<button onClick={decrement}>-</button>
				<p>{getState().count}</p>
			</div>
		);
	}
}

// Render it all
use(reactMiddleware(ReactDOM.render(<Counter />, document.getElementById("container"))));
```

We're down to 36 lines of code for identical functionality! This was done by:

 - Eliminating the need to call `createStore`. Minimux holds the only store
   and gives access to it via `getState()`
 - Eliminating the mapping functions. If you need that level of indirection
   you can still create mock element for mappings external to Minimux, but they
   aren't required.
 - Eliminating "containers". Minimux can bind directly to React components


## Extending Minimux ##

Minimux provides the ability to add middleware to extend its functionality.

Middleware wraps the reducers. When an action is thrown, it first passes
through all middleware. This gives an opportunity to modify or completely
reject the action before it reaches the reducers. After the reducers have
modified the state, the new state is passed back through the middleware before
it is saved to the store. This gives middleware an opportunity to modify the
state before it's saved.

Essentially:

 - Action goes in, state comes out
 - Middleware can alter either en route


Using middleware we can do things like:

 - Record all actions before (or after) they are processed in order to undo /
   time travel
 - Prevent an action based on the state
 - Modify an action in flight or throw errors for invalid actions
 - Update the state after an action has occurred (consider: level up after
   experience is updated if experience exceeds a threshold)


To implement middleware in the most minimal way possible, I look at PHP's
[Onion Library](https://github.com/esbenp/onion)

## Contributin' ##

This is the first time I've ever created a project with the intention of
maintaining it. If you find any issues, please open an issue and I'll try to
respond when I can (usually at night). If you want to contribute, don't
hesitate to send me your pull requests!

Since the purpose of this library is to be **minimalist**, I don't plan to
integrate all sorts of functionality into the core. I **do**, however, want to
provide a multitude of "default" middleware to extend the functionality.

## License ##

**MIT +no-false-attribs**

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

Distributions of all or part of the Software intended to be used by the
recipients as they would use the unmodified Software, containing modifications
that substantially alter, remove, or disable functionality of the Software,
outside of the documented configuration mechanisms provided by the Software,
shall be modified such that the Original Author's bug reporting email addresses
and urls are either replaced with the contact information of the parties
responsible for the changes, or removed entirely.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
