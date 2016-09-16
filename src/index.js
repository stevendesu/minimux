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

let listeners = {};
let containers = [];
let middleware = [];

export var state = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
var callbackOnion = null;

const coreFunction = action => {
	if( listeners[action.type] ) {
		for( var i = 0; i < listeners[action.type].length; i++ ) {
			state = listeners[action.type][i](state, action);
		}
	}
	return state;
}

export function dispatch(action, rerender = true) {
	if( process.env.NODE_ENV === "development" ) {
		// Incorrect usage of a library is going to break your code whether you
		// throw an exception or not. The difference is, exceptions are very
		// large strings of text (poor for minification) and mean nothing to
		// end users. For this reason, I only throw exceptions in development.
		// If you use the browser-compiled version (./minimux.js) intead of the
		// NPM module, it assumes development mode.
		
	}
	if( callbackOnion === null ) {
		middleware.sort((a, b) => {
			return a.priority - b.priority;
		});
		callbackOnion = middleware.reduce((nextLayer, layer) => {
			return currentAction => {
				return layer.func(currentAction, nextLayer);
			};
		}, coreFunction)
	}
	if( !Array.isArray(action) ) {
		action = [action];
	}
	var i;
	for( i = 0; i < action.length; i++ ) {
		state = callbackOnion(action[i]);
	}
	if( rerender ) {
		for( i = 0; i < containers.length; i++ ) {
			containers[i].updater.enqueueForceUpdate(containers[i]);
		}
	}
}

export function listen(type, callback) {
	listeners[type] = listeners[type] || [];
	listeners[type].push(callback);
}

export function connect(container) {
	containers.push(container);
}

export function apply(newMiddleware, priority = 0) {
	middleware.unshift({ priority, func: newMiddleware });
	// Additional middleware was added. We need to recalulate this guy.
	callbackOnion = null;
}
