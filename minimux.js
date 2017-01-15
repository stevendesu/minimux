(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*
 * Minimux v2.0.2
 * Author: Steven Barnett (stevendesu) <steven.abarnett@gmail.com>
 * License: MIT +no-false-attribs (https://spdx.org/licenses/MITNFA.html)
 *
 * I made this library because I liked the ideology of Redux, but not the
 * implementation. This is my attempt to rebuild Redux with absolute minimal
 * functionality and to allow for absolute minimal bootstrapping in order to
 * write effective code.
 *
 * There are four main API endpoints:
 *  - dispatch([actions])
 *     This is the only valid way to modify the state
 *  - register([actions], reducer)
 *     When an action is thrown, apply the reducers
 *  - listen(callbacks)
 *     Callback will be called with the current state whenever state changes
 *  - use(middleware, [priority])
 *     Applies middleware to the dispatch function (see documentation)
 */

var reducers = {};
var callbacks = [];
var middlewares = [];

var state = {};

// The "onion" describes the layers of middleware that we must parse through
// in order to execute our action.
var callbackOnion = null;

// Faster than Array.isArray:
var isArray = function isArray(obj) {
	return obj.constructor === Array;
};

var register = function register(actions, reducer) {
	if ("development" !== "production") {
		if (typeof actions !== "string" && ((typeof actions === "undefined" ? "undefined" : _typeof(actions)) !== "object" || !Array.isArray(actions))) {
			throw "Invalid type (" + (typeof actions === "undefined" ? "undefined" : _typeof(actions)) + ") for argument \"actions\" passed to listen. Expected string.";
		}
		if (typeof reducer !== "function") {
			throw "Invalid type (" + (typeof reducer === "undefined" ? "undefined" : _typeof(reducer)) + ") for argument \"reducer\" passed to listen. Expected " + "function.";
		}
		if (callbackOnion) {
			console.warn("You have attempted to add a new reducer after the state was initialized (an action was " + "thrown). This is illegal.");
		}
	}
	if (!callbackOnion) {
		if (!isArray(actions)) {
			actions = [actions];
		}
		// For loops are faster than forEach
		for (var i = 0, len = actions.length; i < len; i++) {
			var action = actions[i];
			reducers[action] = reducers[action] || [];
			reducers[action].push(reducer);
		}
	}
};

var use = function use(middleware) {
	var priority = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

	if ("development" !== "production") {
		if (typeof middleware !== "function") {
			throw "Invalid type (" + (typeof middleware === "undefined" ? "undefined" : _typeof(middleware)) + ") for argument \"middleware\" passed to listen. Expected " + "function.";
		}
		if (typeof priority !== "number") {
			throw "Invalid type (" + (typeof priority === "undefined" ? "undefined" : _typeof(priority)) + ") for argument \"priority\" passed to listen. Expected " + "number.";
		}
		if (callbackOnion) {
			console.warn("You have attempted to add new middleware after the state was initialized (an action was " + "thrown). This is illegal.");
		}
	}
	if (!callbackOnion) {
		middlewares.unshift({ p: priority, m: middleware });
	}
};

var coreFunction = function coreFunction(action) {
	var newState = state;
	if (reducers[action.type]) {
		// For loops are faster than forEach
		for (var i = 0, len = reducers[action.type].length; i < len; i++) {
			newState = reducers[action.type][i](newState, action);
		}
	}
	return newState;
};

var dispatch = function dispatch(actions) {
	if ("development" !== "production") {
		if ((typeof actions === "undefined" ? "undefined" : _typeof(actions)) !== "object") {
			throw "Invalid type (" + (typeof actions === "undefined" ? "undefined" : _typeof(actions)) + ") for argument \"action\" passed to dispatch. Expected " + "object or array of objects.";
		}
		if (isArray(actions)) {
			actions.forEach(function (el, idx) {
				if ((typeof el === "undefined" ? "undefined" : _typeof(el)) !== "object" || isArray(el)) {
					throw "Invalid type (" + (typeof el === "undefined" ? "undefined" : _typeof(el)) + ") for action at index " + idx + " passed to dispatch. " + "Expected object.";
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
		middlewares.sort(function (a, b) {
			return a.p - b.p;
		});
		callbackOnion = middlewares.reduce(function (nextLayer, layer) {
			return function (currentAction) {
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

var listen = function listen(callback) {
	if ("development" !== "production") {
		if (typeof callback !== "function") {
			throw "Invalid type (" + (typeof callback === "undefined" ? "undefined" : _typeof(callback)) + ") for argument \"callback\" passed to listen. Expected " + "function.";
		}
	}
	callbacks.push(callback);
};

var unlisten = function unlisten(callback) {
	var index = callbacks.indexOf(callback);
	if (index !== -1) {
		callbacks.splice(index, 1);
	}
};

var getState = function getState() {
	return state;
};

// Switching to CommonJS allowed a bit better name mangling for dat mad compression
module.exports = {
	getState: getState,
	dispatch: dispatch,
	register: register,
	listen: listen,
	unlisten: unlisten,
	use: use
};


},{}]},{},[1]);
