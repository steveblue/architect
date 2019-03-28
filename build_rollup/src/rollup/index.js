"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index2_1 = require("@angular-devkit/architect/src/index2");
const path_1 = require("path");
const child_process_1 = require("child_process");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function build(options, root) {
    const async = new Promise((res, rej) => {
        child_process_1.exec(path_1.normalize(root + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
            if (stderr.includes('Error')) {
                if (rej)
                    rej(error);
                //TODO: figure out how to hook into logging
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
    return rxjs_1.of(async);
}
exports.build = build;
function execute(options, context) {
    return build(options, context.workspaceRoot).pipe(operators_1.mapTo({ success: true }), operators_1.catchError(error => {
        context.reportStatus('Error: ' + error);
        return [{ success: false }];
    }));
}
exports.execute = execute;
exports.default = index2_1.createBuilder(execute);
