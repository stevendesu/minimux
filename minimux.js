(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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

var listeners = {};
var containers = [];
var middleware = [];

var state = {};
var mutableState = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
var callbackOnion = null;

var coreFunction = function coreFunction(action) {
	if (listeners[action.type]) {
		listeners[action.type].forEach(function (el) {
			state = el(state, action);
			// This is a temporary (and hideous) hack to maintain backwards compatibility until I'm happy enough with
			// the API to release v2.0.0
			// Previously you could "import { state } from 'minimux'" and it was properly updated
			// This was poor practice because it allowed anyone to edit the state without using actions
			// A getState() function has been added to return only the most recent immutable state
			Object.keys(mutableState).forEach(function (key) {
				delete mutableState[key];
			});
			Object.keys(state).forEach(function (key) {
				mutableState[key] = state[key];
			});
		});
	}
	return state;
};

var dispatch = function dispatch(action) {
	var rerender = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

	if ("development" !== "production") {
		if ((typeof action === "undefined" ? "undefined" : _typeof(action)) !== "object") {
			throw "Invalid type (" + (typeof action === "undefined" ? "undefined" : _typeof(action)) + ") for argument \"action\" passed to dispatch. Expected " + "object or array of objects.";
		}
		if (Array.isArray(action)) {
			action.forEach(function (el, idx) {
				if ((typeof el === "undefined" ? "undefined" : _typeof(el)) !== "object" || Array.isArray(el)) {
					throw "Invalid type (" + (typeof el === "undefined" ? "undefined" : _typeof(el)) + ") for action at index " + idx + " passed to dispatch. " + "Expected object.";
				}
				if (!el.hasOwnProperty("type")) {
					throw "Action at index " + idx + " passed to dispatch was missing required property: \"type\"";
				}
			});
		} else if (!action.hasOwnProperty("type")) {
			throw "Action passed to dispatch was missing required property: \"type\"";
		}
		if (typeof rerender !== "boolean") {
			throw "Invalid type (" + (typeof rerender === "undefined" ? "undefined" : _typeof(rerender)) + ") for argument \"rerender\" passed to dispatch. Expected " + "boolean.";
		}
	}
	if (callbackOnion === null) {
		middleware.sort(function (a, b) {
			return a.priority - b.priority;
		});
		callbackOnion = middleware.reduce(function (nextLayer, layer) {
			return function (currentAction) {
				return layer.func(currentAction, nextLayer);
			};
		}, coreFunction);
	}
	if (!Array.isArray(action)) {
		action = [action];
	}
	action.forEach(function (el) {
		state = callbackOnion(el);
	});
	if (rerender) {
		containers.forEach(function (el) {
			el.updater.enqueueForceUpdate(el);
		});
	}
};

var listen = function listen(type, callback) {
	if ("development" !== "production") {
		if (typeof type !== "string") {
			throw "Invalid type (" + (typeof type === "undefined" ? "undefined" : _typeof(type)) + ") for argument \"type\" passed to listen. Expected string.";
		}
		if (typeof callback !== "function") {
			throw "Invalid type (" + (typeof callback === "undefined" ? "undefined" : _typeof(callback)) + ") for argument \"callback\" passed to listen. Expected " + "function.";
		}
	}
	listeners[type] = listeners[type] || [];
	var index = listeners[type].push(callback) - 1;
	return {
		remove: function remove() {
			delete listeners[type][index];
		}
	};
};

var connect = function connect(container) {
	if ("development" !== "production") {
		if ((typeof container === "undefined" ? "undefined" : _typeof(container)) !== "object") {
			throw "Invalid type (" + (typeof container === "undefined" ? "undefined" : _typeof(container)) + ") for argument \"container\" passed to listen. Expected " + "object.";
		}
		// TODO: Test for ReactDOM.render() return value?
		// Maybe not, actually. I want to get rid of that dependency...
	}
	containers.push(container);
};

var apply = function apply(newMiddleware) {
	var priority = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

	if ("development" !== "production") {
		if (typeof newMiddleware !== "function") {
			throw "Invalid type (" + (typeof newMiddleware === "undefined" ? "undefined" : _typeof(newMiddleware)) + ") for argument \"newMiddleware\" passed to listen. " + "Expected function.";
		}
		if (typeof priority !== "number") {
			throw "Invalid type (" + (typeof priority === "undefined" ? "undefined" : _typeof(priority)) + ") for argument \"priority\" passed to listen. Expected " + "number.";
		}
	}
	middleware.unshift({ priority: priority, func: newMiddleware });
	// Additional middleware was added. We need to recalulate this guy.
	callbackOnion = null;
};

var getState = function getState() {
	return state;
};

// Switching to CommonJS allowed a bit better name mangling for dat mad compression
module.exports = {
	state: mutableState,
	getState: getState,
	dispatch: dispatch,
	listen: listen,
	connect: connect,
	apply: apply
};


},{}]},{},[1]);
