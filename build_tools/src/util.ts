

import * as ts from 'typescript';

import { exec } from 'child_process';
import { normalize, join } from 'path';
import { readFileSync, writeFile, readFile } from 'fs';

import { Observable } from 'rxjs';

import { BuilderContext } from '@angular-devkit/architect/src/index2';
import { AbstractBuilderSchema } from './abstract.interface';

export function compileMain(
  options: AbstractBuilderSchema,
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
               if (err) observer.error(err);
               context.reportProgress(2, 5, 'aot');
               observer.next();
            });

        });

    });
}

export function ngc(
  options: AbstractBuilderSchema,
  context: BuilderContext
): Observable<{}> {

    return new Observable((observer) => {

        exec(normalize(context.workspaceRoot +'/node_modules/.bin/ngc') +
             ' -p ' + options.tsConfig,
             {},
             (error, stdout, stderr) => {
              if (stderr) {
                  observer.error(error);
                  context.reportStatus(stderr);
              } else {
                  context.reportProgress(3, 5, stdout);
                  context.reportStatus('Compilation complete.');
                  observer.next();
              }
        });

    });

}