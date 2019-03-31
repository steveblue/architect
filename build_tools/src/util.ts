import { ClosureBuilderSchema } from './closure/schema.interface';
import { RollupBuilderSchema } from './rollup/schema.interface';


import * as ts from 'typescript';

import { exec } from 'child_process';
import { normalize, join } from 'path';
import { readFileSync, writeFile, readFile } from 'fs';

import { Observable } from 'rxjs';

import { BuilderContext } from '@angular-devkit/architect/src/index2';
import { AbstractBuilderSchema } from './abstract.interface';

export function compileMain(
  options: AbstractBuilderSchema | RollupBuilderSchema | ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {
    return new Observable((observer) => {

        const inFile = normalize(context.workspaceRoot+'/src/main.ts');
        const outFile = normalize('out-tsc/app/src/main.js');
        const tsConfig = JSON.parse(readFileSync(join(context.workspaceRoot, options.tsConfig), 'utf8'));

        readFile(inFile, 'utf8', (err, contents) => {

            if (err) observer.error(err);

            contents = contents.replace(/platformBrowserDynamic/g, 'platformBrowser');
            contents = contents.replace(/platform-browser-dynamic/g, 'platform-browser');
            contents = contents.replace(/bootstrapModule/g, 'bootstrapModuleFactory');
            contents = contents.replace(/AppModule/g, 'AppModuleNgFactory');
            contents = contents.replace(/.module/g, '.module.ngfactory');

            const outputContent = ts.transpileModule(contents, {
              compilerOptions: tsConfig.compilerOptions,
              moduleName: 'app'
            })

            writeFile(outFile, outputContent.outputText, (err) => {
               context.reportProgress(options.step++, options.tally, 'aot');
               if (err) observer.error(err);
               observer.next(outputContent.outputText);
            });

        });

    });
}

export function ngc(
  options: AbstractBuilderSchema | RollupBuilderSchema | ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {
    context.reportProgress(options.step++, options.tally, 'ngc');
    return new Observable((observer) => {

        exec(normalize(context.workspaceRoot +'/node_modules/.bin/ngc') +
             ' -p ' + options.tsConfig,
             {},
             (error, stdout, stderr) => {
              if (stderr) {
                  context.reportStatus(stderr);
                  observer.error(stderr);
              } else {
                  context.reportProgress(options.step++, options.tally, 'ngc');
                  context.reportStatus('Compilation complete.');
                  observer.next(stdout);
              }
        });

    });

}