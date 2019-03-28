"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const index2_1 = require("@angular-devkit/architect/src/index2");
const path_1 = require("path");
const child_process_1 = require("child_process");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const schema_1 = require("./schema");
exports.RollupBuilderOptions = schema_1.Schema;
function build(options, root) {
    return new Promise((res, rej) => {
        child_process_1.exec(path_1.normalize(root + '/node_modules/.bin/rollup') +
            ' -c ' + options.config, { silent: true }, (error, stdout, stderr) => {
            if (stderr.includes('Error')) {
                if (rej)
                    rej(error);
                //log.error(stderr);
                console.log(stderr);
            }
            else {
                //log.message(stderr);
                console.log(stderr);
                res(stderr);
            }
        });
    });
}
exports.build = build;
function watch(options, rollup) {
    const watcher = rollup.watch(watchOptions);
    return watcher;
}
exports.watch = watch;
function initialize(options, root) {
    return __awaiter(this, void 0, void 0, function* () {
        const rollup = (yield Promise.resolve().then(() => require('rollup')));
        // do anything else here for init
        return rollup;
    });
}
function execute(options, context) {
    return rxjs_1.from(build(options, context.workspaceRoot)).pipe(operators_1.mapTo({ success: true }), operators_1.catchError(error => {
        context.reportStatus('Error: ' + error);
        return [{ success: false }];
    }));
}
exports.execute = execute;
exports.default = index2_1.createBuilder(execute);
