/*
 * Minimux %VERSION%
 * Author: Steven Barnett (stevendesu) <steven.abarnett@gmail.com>
 * License: MIT +no-false-attribs (https://spdx.org/licenses/MITNFA.html)
 *
 * I made this library because I liked the ideology of Redux, but not the
 * implementation. This is my attempt to rebuild Redux with absolute minimal
 * functionality and to allow for absolute minimal bootstrapping in order to
 * write effective code.
 *
 * There are four main API endpoints:
 *  - dispatch(action, [data])
 *     This is the only valid way to modify the state
 *  - on(actions, reducer)
 *     When an action is thrown, apply the reducers
 *  - bind(callback)
 *     Callback will be called with the current state whenever state changes
 *  - apply(middleware, [priority])
 *     Applies middleware to the dispatch function (see documentation)
 *
 * Considerations:
 *  - Should it be possible to connect to a subset of the state? If you could
 *    bind reducers to subsets of state then it would be more modular
 */

const reducers = {};
const callbacks = [];
const middlewares = [];

let state = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
let callbackOnion = null;

// Faster than Array.isArray:
const isArray = (obj) => { return obj.constructor === Array; };

const register = (actions, reducer) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof actions !== "string" && (typeof actions !== "object" || !Array.isArray(actions))) {
			throw "Invalid type (" + (typeof actions) + ") for argument \"actions\" passed to listen. Expected string.";
		}
		if (typeof reducer !== "function") {
			throw "Invalid type (" + (typeof reducer) + ") for argument \"reducer\" passed to listen. Expected " +
			      "function.";
		}
		if (callbackOnion) {
			console.warn("You have attempted to add a new reducer after the state was initialized (an action was " +
			             "thrown). This is illegal.");
		}
	}
	if (!callbackOnion) {
		if (!isArray(actions)) {
			actions = [actions];
		}
		// For loops are faster than forEach
		for (let i = 0, len = actions.length; i < len; i++) {
			const action = actions[i];
			reducers[action] = reducers[action] || [];
			reducers[action].push(reducer);
		}
	}
};

const use = (middleware, priority = 0) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof middleware !== "function") {
			throw "Invalid type (" + (typeof middleware) + ") for argument \"middleware\" passed to listen. Expected " +
			      "function.";
		}
		if (typeof priority !== "number") {
			throw "Invalid type (" + (typeof priority) + ") for argument \"priority\" passed to listen. Expected " +
			      "number.";
		}
		if (callbackOnion) {
			console.warn("You have attempted to add new middleware after the state was initialized (an action was " +
			             "thrown). This is illegal.");
		}
	}
	if (!callbackOnion) {
		middlewares.unshift({ p: priority, m: middleware });
	}
};

const coreFunction = (action) => {
	let newState = state;
	if (reducers[action.type]) {
		// For loops are faster than forEach
		for (let i = 0, len = reducers[action.type].length; i < len; i++) {
			newState = reducers[action.type](newState, action);
		}
	}
	return newState;
};

const dispatch = (actions) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof action !== "object") {
			throw "Invalid type (" + (typeof action) + ") for argument \"action\" passed to dispatch. Expected " +
			      "object or array of objects.";
		}
		if (isArray(actions)) {
			actions.forEach((el, idx) => {
				if (typeof el !== "object" || isArray(el)) {
					throw "Invalid type (" + (typeof el) + ") for action at index " + idx + " passed to dispatch. " +
					      "Expected object.";
				}
				if (!el.hasOwnProperty("type")) {
					throw "Action at index " + idx + " passed to dispatch was missing required property: \"type\"";
				}
			});
		} else if (!actions.hasOwnProperty("type")) {
			throw "Action passed to dispatch was missing required property: \"type\"";
		}
	}
	if (!callbackOnion) {
		middlewares.sort((a, b) => {
			return a.p - b.p;
		});
		callbackOnion = middlewares.reduce((nextLayer, layer) => {
			return (currentAction) => {
				return layer.m(currentAction, nextLayer);
			};
		}, coreFunction);
	}
	if (!isArray(actions)) {
		actions = [actions];
	}
	// For loops are faster than forEach
	// Although length caching only improved performance when there are more than 2-3 elements
	// USUALLY dispatch() will be called with 1 action at a time
	var i;
	for (i = 0; i < actions.length; i++) {
		state = callbackOnion(actions[i]);
	}
	for (i = 0; i < callbacks.length; i++) {
		callbacks[i](state);
	}
};

const listen = (callback) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof callback !== "function") {
			throw "Invalid type (" + (typeof callback) + ") for argument \"callback\" passed to listen. Expected " +
			      "function.";
		}
	}
	callbacks.push(callback);
};

const unlisten = (callback) => {
	const index = callbacks.indexOf(callback);
	if (index !== -1) {
		callbacks.splice(index, 1);
	}
};

const getState = () => {
	return state;
};

// Switching to CommonJS allowed a bit better name mangling for dat mad compression
module.exports = {
	getState,
	dispatch,
	register,
	listen,
	unlisten,
	use
};
