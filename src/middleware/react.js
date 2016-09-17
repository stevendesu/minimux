/*
 * Minimux v1.0.0 - React Middleware
 * Author: Steven Barnett (stevendesu) <steven.abarnett@gmail.com>
 * License: MIT +no-false-attribs (https://spdx.org/licenses/MITNFA.html)
 *
 * Usage:
 *
 *    import { apply } from 'minimux';
 *    import { reactMiddleware } from 'minimux/middleware';
 *    apply(reactMiddleware(ReactDOM.render(<App />, document.getElementById('container'));
 */

module.exports = (reactComponent) => {
	return (action, next) => {
		const state = next(action);
		reactComponent.updater.enqueueForceUpdate(reactComponent);
		return state;
	};
};
