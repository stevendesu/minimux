/*
 * Minimux v1.0.0
 * Author: Steven Barnett (stevendesu) <steven.abarnett@gmail.com>
 * License: MIT +no-false-attribs (https://spdx.org/licenses/MITNFA.html)
 *
 * I made this library because I liked the ideology of Redux, but not the
 * implementation. This is my attempt to rebuild Redux with absolute minimal
 * functionality and to allow for absolute minimal bootstrapping in order to
 * write effective code.
 *
 * Considerations:
 *  - Two of our functions (connect and apply) are one-liners... why not just
 *    make "containers" and "middleware" public?
 *  - What should be the return values of each function?
 *  - How do you UNbind middleware or DISconnect containers? Or UNlisten?
 *  - Should it be possible to connect to a subset of the state? If you could
 *    bind reducers to subsets of state then it would be more modular
 *  - Could we add support for CJS, AMD, and UMD? Maybe as a build step?
 */

const listeners = {};
const containers = [];
const middleware = [];

export var state = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
let callbackOnion = null;

const coreFunction = (action) => {
	if (listeners[action.type]) {
		listeners[action.type].forEach((el) => {
			state = el(state, action);
		});
	}
	return state;
};

export function dispatch(action, rerender = true) {
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
			el.updater.enqueueForceUpdate(el);
		});
	}
}

export function listen(type, callback) {
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
	listeners[type].push(callback);
}

export function connect(container) {
	if (process.env.NODE_ENV !== "production") {
		if (typeof container !== "object") {
			throw "Invalid type (" + (typeof container) + ") for argument \"container\" passed to listen. Expected " +
			      "object.";
		}
		// TODO: Test for ReactDOM.render() return value?
		// Maybe not, actually. I want to get rid of that dependency...
	}
	containers.push(container);
}

export function apply(newMiddleware, priority = 0) {
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
}
