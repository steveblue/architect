"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index2_1 = require("@angular-devkit/architect/src/index2");
const child_process_1 = require("child_process");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function ngc(options, context) {
    return new Promise((res, rej) => {
        child_process_1.exec(path_1.normalize(context.workspaceRoot + '/node_modules/.bin/ngc') +
            ' -p ' + options.tsConfig, {}, (error, stdout, stderr) => {
            if (stderr.includes('Error')) {
                if (rej)
                    rej(error);
            }
            else {
                context.reportProgress(3, 5, stdout);
                res(stderr);
            }
        });
    });
}
exports.ngc = ngc;
function rollup(options, context) {
    return new Promise((res, rej) => {
        context.reportProgress(4, 5, 'rollup');
        child_process_1.exec(path_1.normalize(context.workspaceRoot + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
            if (stderr.includes('Error')) {
                if (rej)
                    rej(error);
            }
            else {
                context.reportProgress(5, 5, stdout);
                res(stderr);
            }
        });
    });
}
exports.rollup = rollup;
async function build(options, context) {
    await ngc(options, context);
    await rollup(options, context);
    return options;
}
function execute(options, context) {
    context.reportProgress(2, 5, 'ngc');
    return rxjs_1.from(build(options, context)).pipe(operators_1.mapTo({ success: true }), operators_1.catchError(error => {
        context.reportStatus('Error: ' + error);
        return [{ success: false }];
    }));
}
exports.execute = execute;
exports.default = index2_1.createBuilder(execute);
