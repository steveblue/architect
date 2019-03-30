"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index2_1 = require("@angular-devkit/architect/src/index2");
const child_process_1 = require("child_process");
const ts = __importStar(require("typescript"));
const path_1 = require("path");
const fs_1 = require("fs");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function compileMain(options, context) {
    return new Promise((res, rej) => {
        const inFile = path_1.normalize(context.workspaceRoot + '/src/main.ts');
        const outFile = path_1.normalize('out-tsc/app/src/main.js');
        const tsConfig = JSON.parse(fs_1.readFileSync(path_1.join(context.workspaceRoot, options.tsConfig), 'utf8'));
        fs_1.readFile(inFile, 'utf8', (err, contents) => {
            if (err)
                rej(err);
            contents = contents.replace(/platformBrowserDynamic/g, 'platformBrowser');
            contents = contents.replace(/platform-browser-dynamic/g, 'platform-browser');
            contents = contents.replace(/bootstrapModule/g, 'bootstrapModuleFactory');
            contents = contents.replace(/AppModule/g, 'AppModuleNgFactory');
            contents = contents.replace(/.module/g, '.module.ngfactory');
            const outputContent = ts.transpileModule(contents, {
                compilerOptions: tsConfig.compilerOptions,
                moduleName: 'app'
            });
            fs_1.writeFile(outFile, outputContent.outputText, (err) => {
                if (err)
                    rej(err);
                context.reportProgress(2, 5, 'aot');
                res();
            });
        });
    });
}
exports.compileMain = compileMain;
function ngc(options, context) {
    return new Promise((res, rej) => {
        child_process_1.exec(path_1.normalize(context.workspaceRoot + '/node_modules/.bin/ngc') +
            ' -p ' + options.tsConfig, {}, (error, stdout, stderr) => {
            if (stderr) {
                if (rej)
                    rej(error);
                context.reportStatus(stderr);
            }
            else {
                context.reportProgress(3, 5, stdout);
                context.reportStatus('Compilation complete.');
                res();
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
                context.reportStatus(stderr);
            }
            else {
                context.reportProgress(5, 5, stderr);
                res(stderr);
            }
        });
    });
}
exports.rollup = rollup;
async function build(options, context) {
    await ngc(options, context);
    await compileMain(options, context);
    await rollup(options, context);
    return options;
}
function execute(options, context) {
    context.reportProgress(1, 5, 'ngc');
    return rxjs_1.from(build(options, context)).pipe(operators_1.mapTo({ success: true }), operators_1.catchError(error => {
        context.reportStatus('Error: ' + error);
        return [{ success: false }];
    }));
}
exports.execute = execute;
exports.default = index2_1.createBuilder(execute);
