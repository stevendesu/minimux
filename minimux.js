(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.dispatch = dispatch;
exports.listen = listen;
exports.connect = connect;
exports.apply = apply;
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

var listeners = {};
var containers = [];
var middleware = [];

var state = exports.state = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
var callbackOnion = null;

var coreFunction = function coreFunction(action) {
	if (listeners[action.type]) {
		for (var i = 0; i < listeners[action.type].length; i++) {
			exports.state = state = listeners[action.type][i](state, action);
		}
	}
	return state;
};

function dispatch(action) {
	var rerender = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

	if ("development" === "development") {
		// Incorrect usage of a library is going to break your code whether you
		// throw an exception or not. The difference is, exceptions are very
		// large strings of text (poor for minification) and mean nothing to
		// end users. For this reason, I only throw exceptions in development.
		// If you use the browser-compiled version (./minimux.js) intead of the
		// NPM module, it assumes development mode.

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
	var i;
	for (i = 0; i < action.length; i++) {
		exports.state = state = callbackOnion(action[i]);
	}
	if (rerender) {
		for (i = 0; i < containers.length; i++) {
			containers[i].updater.enqueueForceUpdate(containers[i]);
		}
	}
}

function listen(type, callback) {
	listeners[type] = listeners[type] || [];
	listeners[type].push(callback);
}

function connect(container) {
	containers.push(container);
}

function apply(newMiddleware) {
	var priority = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

	middleware.unshift({ priority: priority, func: newMiddleware });
	// Additional middleware was added. We need to recalulate this guy.
	callbackOnion = null;
}


},{}]},{},[1]);
