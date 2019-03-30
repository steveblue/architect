"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const successBuildEvent = {
    success: true,
};
const failBuildEvent = {
    success: false,
};
class BrowserTarget {
    run(_browserConfig) {
        return new rxjs_1.Observable(obs => {
            obs.next(successBuildEvent);
            obs.next(failBuildEvent);
            obs.next(successBuildEvent);
            obs.complete();
        });
    }
}
exports.default = BrowserTarget;
