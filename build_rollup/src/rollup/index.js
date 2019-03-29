"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index2_1 = require("@angular-devkit/architect/src/index2");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const child_process_1 = require("child_process");
function ngc(options, root) {
    return new Promise((res, rej) => {
        child_process_1.exec(path_1.normalize(root + '/node_modules/.bin/ngc') +
            ' -p ' + options.tsConfig, {}, (error, stdout, stderr) => {
            if (stderr.includes('Error')) {
                if (rej)
                    rej(error);
            }
            else {
                res(stderr);
            }
        });
    });
}
exports.ngc = ngc;
function rollup(options, root) {
    return new Promise((res, rej) => {
        child_process_1.exec(path_1.normalize(root + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
            if (stderr.includes('Error')) {
                if (rej)
                    rej(error);
            }
            else {
                res(stderr);
            }
        });
    });
}
exports.rollup = rollup;
async function build(options, root) {
    await ngc(options, root);
    await rollup(options, root);
    return options;
}
function execute(options, context) {
    return rxjs_1.from(build(options, context.workspaceRoot)).pipe(operators_1.mapTo({ success: true }), operators_1.catchError(error => {
        context.reportStatus('Error: ' + error);
        return [{ success: false }];
    }));
}
exports.execute = execute;
exports.default = index2_1.createBuilder(execute);
