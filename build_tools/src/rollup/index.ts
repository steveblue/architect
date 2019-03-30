import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';

import { exec } from 'child_process';
import * as ts from 'typescript';

import { normalize, join } from 'path';
import { readFileSync, writeFile, readFile } from 'fs';

import { Observable, from } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { RollupBuilderSchema } from './schema.interface';

export function compileMain(
  options: RollupBuilderSchema,
  context: BuilderContext
): Promise<{}> {
    return new Promise((res, rej) => {

        const inFile = normalize(context.workspaceRoot+'/src/main.ts');
        const outFile = normalize('out-tsc/app/src/main.js');
        const tsConfig = JSON.parse(readFileSync(join(context.workspaceRoot, options.tsConfig), 'utf8'));

        readFile(inFile, 'utf8', (err, contents) => {

            if (err) rej(err);

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
               if (err) rej(err);
               context.reportProgress(2, 5, 'aot');
               res();
            });

        });

    });
}

export function ngc(
  options: RollupBuilderSchema,
  context: BuilderContext
): Promise<{}> {

    return new Promise((res, rej) => {

        exec(normalize(context.workspaceRoot +'/node_modules/.bin/ngc') +
             ' -p ' + options.tsConfig,
             {},
             (error, stdout, stderr) => {
              if (stderr) {
                  if (rej) rej(error);
                  context.reportStatus(stderr);
              } else {
                  context.reportProgress(3, 5, stdout);
                  context.reportStatus('Compilation complete.');
                  res();
              }
        });

    });

}


export function rollup(
  options: RollupBuilderSchema,
   context: BuilderContext
): Promise<{}> {

    return new Promise((res, rej) => {
        context.reportProgress(4, 5, 'rollup');
        exec(normalize(context.workspaceRoot + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
                if (stderr.includes('Error')) {
                    if (rej) rej(error);
                    context.reportStatus(stderr);
                } else {
                    context.reportProgress(5, 5, stderr);
                    res(stderr);
                }

        });
    });
}

async function build(
  options: RollupBuilderSchema,
  context: BuilderContext,
): Promise<RollupBuilderSchema> {

  await ngc(options, context);
  await compileMain(options, context);
  await rollup(options, context);

  return options;

}

export function execute(
  options: RollupBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  context.reportProgress(1, 5, 'ngc');
  return from(build(options, context)).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & RollupBuilderSchema>(execute);