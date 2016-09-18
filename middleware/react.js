"use strict";

/*
 * Minimux v1.1.0 - React Middleware
 * Author: Steven Barnett (stevendesu) <steven.abarnett@gmail.com>
 * License: MIT +no-false-attribs (https://spdx.org/licenses/MITNFA.html)
 *
 * Usage:
 *
 *    import { apply } from 'minimux';
 *    import { reactMiddleware } from 'minimux/middleware';
 *    apply(reactMiddleware(ReactDOM.render(<App />, document.getElementById('container'));
 */

module.exports = function (reactComponent) {
  return function (action, next) {
    var state = next(action);
    reactComponent.updater.enqueueForceUpdate(reactComponent);
    return state;
  };
};
//# sourceMappingURL=react.js.map
