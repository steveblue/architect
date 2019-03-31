import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec } from 'child_process';
import { normalize, join } from 'path';
import { readFileSync } from 'fs';

import { Observable, of } from 'rxjs';
import { catchError, mapTo, concatMap } from 'rxjs/operators';

import { RollupBuilderSchema } from './schema.interface';

export function rollup(
  options: RollupBuilderSchema,
   context: BuilderContext
): Observable<{}> {
    context.reportStatus('rollup');
    return new Observable((observer) => {
        context.reportProgress(options.step++, options.tally, 'rollup');
        exec(normalize(context.workspaceRoot + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
                if (stderr.includes('Error')) {
                    context.reportStatus(stderr);
                    observer.error(error);
                } else {
                    context.reportProgress(options.step++, options.tally, 'rollup');
                    observer.next(stdout);
                }

        });
    });
}

export function executeRollup(
  options: RollupBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {

  const tsConfig = JSON.parse(readFileSync(join(context.workspaceRoot, options.tsConfig), 'utf8'));

  if (!options.compilationMode) {
    options.compilationMode = tsConfig.angularCompilerOptions &&
                              tsConfig.angularCompilerOptions.enableIvy === true ? 'ivy' : 'aot';
  }

  options.step = 0;
  options.tally = 4;
  return of(context).pipe(
            concatMap( results => ngc(options, context) ),
            (options.compilationMode !== 'aot') ? concatMap( results => of(results) ) : concatMap( results => compileMain(options, context) ),
            concatMap( results => rollup(options, context) ),
            mapTo({ success: true }),
            catchError(error => {
              context.reportStatus('Error: ' + error);
              return [{ success: false }];
            })
          );
}

export default createBuilder<Record<string, string> & RollupBuilderSchema>(executeRollup);