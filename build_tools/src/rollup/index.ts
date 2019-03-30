import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec } from 'child_process';
import { normalize } from 'path';

import { Observable, of } from 'rxjs';
import { catchError, mapTo, concatMap } from 'rxjs/operators';

import { RollupBuilderSchema } from './schema.interface';

export function rollup(
  options: RollupBuilderSchema,
   context: BuilderContext
): Observable<{}> {

    return new Observable((observer) => {
        context.reportProgress(4, 5, 'rollup');
        exec(normalize(context.workspaceRoot + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
                if (stderr.includes('Error')) {
                    observer.error(error);
                    context.reportStatus(stderr);
                } else {
                    context.reportProgress(5, 5, stderr);
                    observer.next(stderr);
                }

        });
    });
}

export function executeRollup(
  options: RollupBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  context.reportProgress(1, 5, 'ngc');
  return of(context).pipe(
            concatMap( results => ngc(options, context) ),
            concatMap( results => compileMain(options, context) ),
            concatMap( results => rollup(options, context) ),
            mapTo({ success: true }),
            catchError(error => {
              context.reportStatus('Error: ' + error);
              return [{ success: false }];
            })
          );
}

export default createBuilder<Record<string, string> & RollupBuilderSchema>(executeRollup);