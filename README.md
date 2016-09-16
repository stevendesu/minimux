# Minimux #

>A minimist state management library (inspired by Redux)
>
>v1.0.0
>
>Copyright 2016 Steven Barnett (stevendesu)

## Table of Contents ##

 - [Description](#description)
 - [Requirements](#requriements)
 - [Installation](#installation)
 - [Usage](#usage)
 - [Why Not Redux?](#why-not-redux)
 - [Ideology](#ideology)
 - [Better State Management](#better-state-management)
 - [But What About (Insert Redux Feature) ???](#but-what-about-insert-redux-feature-)
 - [Contributin'](#contributin)
 - [License](#license)

## Description ##

Minimux was invented because I liked the ideology of Redux, but not the
implementation. This is my attempt to rebuild Redux with absolute minimal
functionality and to allow for absolute minimal boilerplate in order to write
effective code.

## Requirements ##

The only requirement at the moment (eventually should be removed) is React.

React is not required to manage state, dispatch actions, or attach listeners
(reducers). However after all reducers have run and updated the state, the only
method of broadcasting the new state currently is that any React component
attached with the `connect` method will be re-rendered. Generic broadcasting
to come later.

## Installation ##

Currently the package is not hosted on NPM. I know -- I'm bad. I'm waiting to
knock out the "TODOs" before posting it there. I also need to learn how to
properly number things so that when someone puts `~1.0.0` in their package.json
they aren't delivered `v1.1.0`

For now, to install, please click "Clone or download" above and select "Download
ZIP"

You can extract this ZIP file anywhere you'd like. I tend to put it just above
my root directory in a folder called "minimux"

## Usage ##

The following usage assumes you have installed this in `./minimux`. Once I have
NPM stuff working correctly it will be slightly easier.

**Actions:**

```js
// ./actions/index.js
import { dispatch } from '../minimux/dist';

export function myAction() {
	dispatch({ type: 'MY_ACTION' });
}

export function actionWithParams(params) {
	return function() { dispatch({ type: 'PARAMS_ACTION', value: params }); };
}

// ./components/my-component.jsx
import React from 'react';
import { myAction, actionWithParams } from '../actions';

class MyComponent extends React.Component {
	render() {
		return <input onKeyDown={myAction} onKeyPress={actionWithParams('abc')} />;
	}
}
```

**Reducers:**

```js
import { listen } from '../minimux/dist';

listen('PARAMS_ACTION', function(state, action) {
	return { value: action.value };
});
```

**"Containers":**

```js
import { connect } from '../minimux/dist';

connect(ReadDOM.render(<App />, document.getElementById("container")));
```

Note: Minimux can only connect to **class components**. If `<App>` is a
functional component then it must be refactored as a class component for the
connect function to work.

**Middleware:**

```js
import { apply } from '../minimux/dist';

apply(function(action, nextLayer) {
	// Modify the action here for "pre" middleware
	let state = nextLayer(action);
	// Modify the state here for "post" middleware
	return state;
});
```

## Why Not Redux? ##

If you're already using Redux, by all means: don't stop. It's a great library!

If you have never used Redux before and you're new to the concept of using a
library to manage your state, I believe that my library will prove more friendly
to newbies and will get you up and running with far less code.

This library started as a way to simplify a personal project of mine. I wanted
to learn React+Redux so I decided to create a simple incremental game using
these two technologies.

First, I learned React... and **I loved it**. Everything about it was perfect.
It turned your HTML into self-contained components just like Angular or Polymer,
but with 1/10th the boilerplate of Angular and with twice the performance of
Polymer. The shadow DOM made apps blazingly fast no matter how many elements you
put on the page, and the fact that state could be passed down to elements as
properties... just amazing

Next, I learned Redux... it sounded **awesome**. You keep the full state of your
app (or game, in my case) in one place, then using the component properites you
hand it to the view and it's rendered by **stateless components**. Your view and
your state are entirely separate and always in sync. If you gain a level you
don't have to worry about the level over your head being correct but the level
in the stats menu being wrong: there's a single source of truth

Finally, I learned React-Redux. That pesky little library that binds the two
together. At first it didn't feel... **that** bad... So instead of just
components, if something is going to read state then it's a **container**...
Okay, I can work with that. And then a container needs a mapping function to
map the state to its properties... a bit awkward, but makes sense... But then
you **also** need a mapping function to map **actions** to properties. Now it's
getting silly... And then the whole thing didn't render because... I needed to
wrap the whole app in some phony "Provider" component? Where did that come from?

Suddenly React and Redux, both of which promised simplicity, felt like Angular:
which promises magic but only if you're willing to scale the vertical learning
curve. Personally? I wasn't willing. So I made this: **Minimux**

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

The simple Redux example of a counter with a `plus` and `minus` button could
therefore be build without the use of Redux at all using the following code:

```js
var state = { count: 0 }; // Single source of truth

function update(action) {
	if( action == 1 ) {
		state = { count: state.count + 1 }; // Overwrite the original object
	} else {
		state = { count: state.count - 1 };
	}
}

document.write('<button onclick="update(1)">+</button> <button onclick="update(-1)">+</button>');
```

Although this is a poor way to manage state (discussed in the next section), it
adhere to the three principles of Redux.

## Better State Management ##

Although additional concerns may be raised, the biggset issue with the code in
the previous section is simple: **it offers no way to inform display elements
that the state has changed**. You can update the count all day long but any
`<span>` or `<p>` rendering the current state will sit blissfully unaware at 0

For a state manager to be valuable, it needs to implement this one critical
feature: **Event Dispatching**

So to create a minimist state manager, I basically needed an event dispatcher.
When an action is thrown, update the state, then dispatch an event. Fortunately
we don't have to re-invent the wheel: [Event dispatchers are well documented](https://github.com/millermedeiros/js-signals/wiki/Comparison-between-different-Observer-Pattern-implementations)

As we want a **single source of truth**, and we want to keep this library
light-weight and simple, I favored the **Publish / Subscribe** pattern. Minimux
acts as a broadcaster and you can subscribe (listen) or publish (dispatch) for
any action.

The major advantage to this minimist approach is that the amount of code you
need to write in order to start using minimist is... well, **minimal**

Consider the following using React-Redux:

```js
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

Holy **crap** that was a mouthful. Now let's do the same thing in Minimux:

```
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { listen, dispatch, state } from 'minimux';

// Reducers
listen('INCREMENT', (state, action) => {
	return { count: count + 1 };
});
listen('DECREMENT', (state, action) => {
	return { count: count + 1 };
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
				<p>{state.count}</p>
			</div>
		);
	}
}

// Render it all
connect(ReactDOM.render(<Counter />, document.getElementById("container"));
```

Notice that by connecting the root DOM node to Minimux we've **completely
eliminated the need for containers**. By making the state available to any part
of our code (via `import` statement) we avoid the mess of passing it through
components. By keeping it simple, we reduce the overall code written to
accomplish the same goal.

## But What About (Insert Redux Feature) ??? ##

Many people who switched to Redux did so because it offered some absolutely
magical abilities. Things like [time travel](https://github.com/gaearon/redux-devtools)
become really simple.

The same is possible with Minimux with a small adjustment. Since we follow the
three core principles of Redux, the state can be calculated by re-running all
reducers on a list of all past actions. Actions can be injected into this list
or removed from this list and the calculations run to get the exact same
behavior.

At first I had the action list a core part of Minimux, but I soon realized that
a videogame throwing events every tenth of a second from a timer and every time
someone clicks button or moves the mouse would quickly flood the memory with
events long-past that no one cares about anymore. I also realized that something
like time travel and undo aren't core features of state management, but they're
more like **add-ons**.

For this reason, I expanded Minimux with [middleware](http://www.nixtu.info/2013/03/middleware-pattern-in-javascript.html)

Using middleware we can do things like:

 - Record all actions before (or after) they are processed in order to undo / time travel
 - Prevent an action based on the state
 - Modify an action in flight or throw errors for invalid actions
 - Update the state after an action has occurred (consider: level up after experience is updated if experience exceeds a threshold)

To implement middleware in the most minimal way possible, I look at PHP's [Onion Library](https://github.com/esbenp/onion)

All of this for just **537 bytes minified and gzipped**

## Contributin' ##

This is the first time I've ever created a project with the intention of
maintaining it. If you find any issues, please open an issue and I'll try to
respond when I can (usually at night). If you want to contribute, don't
hesitate to send me your pull requests!

Since the purpose of this library is to be **minimist**, I don't plan to
integrate all sorts of functionality into the core. I **do**, however, want to
provide a multitude of "default" middleware to extend the functionality.

## License ##

**MIT +no-false-attribs**

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

Distributions of all or part of the Software intended to be used by the recipients as they would use the unmodified Software, containing modifications that substantially alter, remove, or disable functionality of the Software, outside of the documented configuration mechanisms provided by the Software, shall be modified such that the Original Author's bug reporting email addresses and urls are either replaced with the contact information of the parties responsible for the changes, or removed entirely.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
