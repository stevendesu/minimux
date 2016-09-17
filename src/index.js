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
 * Now that I've knocked out all of my "TODO"s, I'm officially calling this the
 * end of "patches", and from now on a patch will only be a bugfix. Any feature
 * additions will be minor updates.
 *
 * Considerations:
 *  - Two of our functions (connect and apply) are one-liners... why not just
 *    make "containers" and "middleware" public?
 *  - What should be the return values of each function?
 *  - How do you UNbind middleware or DISconnect containers? Or UNlisten?
 *  - Should it be possible to connect to a subset of the state? If you could
 *    bind reducers to subsets of state then it would be more modular
 */

const listeners = {};
const containers = [];
const middleware = [];

let state = {};
const mutableState = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
let callbackOnion = null;

const coreFunction = (action) => {
	if (listeners[action.type]) {
		listeners[action.type].forEach((el) => {
			state = el(state, action);
			// This is a temporary (and hideous) hack to maintain backwards compatibility until I'm happy enough with
			// the API to release v2.0.0
			// Previously you could "import { state } from 'minimux'" and it was properly updated
			// This was poor practice because it allowed anyone to edit the state without using actions
			// A getState() function has been added to return only the most recent immutable state
			Object.keys(mutableState).forEach((key) => {
				delete mutableState[key];
			});
			Object.keys(state).forEach((key) => {
				mutableState[key] = state[key];
			});
		});
	}
	return state;
};

const dispatch = (action, rerender = true) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof action !== "object") {
			throw "Invalid type (" + (typeof action) + ") for argument \"action\" passed to dispatch. Expected " +
			      "object or array of objects.";
		}
		if (Array.isArray(action)) {
			action.forEach((el, idx) => {
				if (typeof el !== "object" || Array.isArray(el)) {
					throw "Invalid type (" + (typeof el) + ") for action at index " + idx + " passed to dispatch. " +
					      "Expected object.";
				}
				if (!el.hasOwnProperty("type")) {
					throw "Action at index " + idx + " passed to dispatch was missing required property: \"type\"";
				}
			});
		} else if (!action.hasOwnProperty("type")) {
			throw "Action passed to dispatch was missing required property: \"type\"";
		}
		if (typeof rerender !== "boolean") {
			throw "Invalid type (" + (typeof rerender) + ") for argument \"rerender\" passed to dispatch. Expected " +
			      "boolean.";
		}
	}
	if (callbackOnion === null) {
		middleware.sort((a, b) => {
			return a.priority - b.priority;
		});
		callbackOnion = middleware.reduce((nextLayer, layer) => {
			return (currentAction) => {
				return layer.func(currentAction, nextLayer);
			};
		}, coreFunction);
	}
	if (!Array.isArray(action)) {
		action = [action];
	}
	action.forEach((el) => {
		state = callbackOnion(el);
	});
	if (rerender) {
		containers.forEach((el) => {
			if (typeof el === "function") {
				el(state);
			} else {
				el.updater.enqueueForceUpdate(el);
			}
		});
	}
};

const listen = (type, callback) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof type !== "string") {
			throw "Invalid type (" + (typeof type) + ") for argument \"type\" passed to listen. Expected string.";
		}
		if (typeof callback !== "function") {
			throw "Invalid type (" + (typeof callback) + ") for argument \"callback\" passed to listen. Expected " +
			      "function.";
		}
	}
	listeners[type] = listeners[type] || [];
	const index = listeners[type].push(callback) - 1;
	return {
		remove: () => {
			delete listeners[type][index];
		}
	};
};

const connect = (container) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof container !== "object" && typeof container !== "function") {
			throw "Invalid type (" + (typeof container) + ") for argument \"container\" passed to listen. Expected " +
			      "function (object accepted for now).";
		}
		// Importing React just to test instanceof means adding 14 kB of overhead for something I intend to deprecate
		/*
		if (typeof container === "object" && !container instanceof React.Component) {
			throw "Invalid type (object) for argument \"container\" passed to listen. If an object is passed, it " +
			      "must be an instance of React.Component."
		}
		*/
	}
	containers.push(container);
};

const apply = (newMiddleware, priority = 0) => {
	if (process.env.NODE_ENV !== "production") {
		if (typeof newMiddleware !== "function") {
			throw "Invalid type (" + (typeof newMiddleware) + ") for argument \"newMiddleware\" passed to listen. " +
			      "Expected function.";
		}
		if (typeof priority !== "number") {
			throw "Invalid type (" + (typeof priority) + ") for argument \"priority\" passed to listen. Expected " +
			      "number.";
		}
	}
	middleware.unshift({ priority, func: newMiddleware });
	// Additional middleware was added. We need to recalulate this guy.
	callbackOnion = null;
};

const getState = () => {
	return state;
};

// Switching to CommonJS allowed a bit better name mangling for dat mad compression
module.exports = {
	state: mutableState,
	getState,
	dispatch,
	listen,
	connect,
	apply
};
