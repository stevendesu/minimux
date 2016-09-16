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
 * TODO (for anyone who wants to contribute):
 *  - There's currently no error handling or exception throwing. Pass an integer
 *    to dispatch() and the whole thing explodes
 * 
 * Considerations:
 *  - Two of our functions (connect and apply) are one-liners... why not just
 *    make "containers" and "middleware" public?
 *  - What should be the return values of each function?
 *  - How do you UNbind middleware or DISconnect containers? Or UNlisten?
 *  - Should it be possible to connect to a subset of the state? If you could
 *    bind reducers to subsets of state then it would be more modular
 *  - Could we add support for CJS, AMD, and UMD? Maybe as a build step?
 *  - 
 */

export var state = {};
let listeners = {};
let containers = [];
let middleware = [];

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
	if( callbackOnion === null ) {
		middleware.sort((a, b) => {
			return a.priority - b.priority;
		});
		// This function isn't ugly on purpose. I just copied the functionality of
		// PHP's Onion library (https://github.com/esbenp/onion/) and translated
		// to JavaScript, leaving out unnecessary calls like call_user_func_array
		//
		// I'm open to anyone who can rewrite this to be a little more obvious
		// what's going on
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
