import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec } from 'child_process';
import { normalize } from 'path';

import { Observable, from } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { RollupBuilderSchema } from './schema.interface';

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

async function buildRollup(
  options: RollupBuilderSchema,
  context: BuilderContext,
): Promise<RollupBuilderSchema> {

  await ngc(options, context);
  await compileMain(options, context);
  await rollup(options, context);

  return options;

}

export function executeRollup(
  options: RollupBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  context.reportProgress(1, 5, 'ngc');
  return from(buildRollup(options, context)).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & RollupBuilderSchema>(executeRollup);