import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { json } from '@angular-devkit/core';
import { exec } from 'child_process';
import { resolve, normalize, join } from 'path';
import { Observable, from, of } from 'rxjs';
import { catchError, mapTo, map } from 'rxjs/operators';
import { RollupBuilderSchema } from './schema.interface';


export function ngc(
  options: RollupBuilderSchema,
  context: BuilderContext
): Promise<{}> {

    return new Promise((res, rej) => {

        exec(join(context.workspaceRoot, 'node_modules', '.bin', 'ngc') +
             ' -p ' + options.tsConfig,
             {},
             (error, stdout, stderr) => {
              if (stderr) {
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
  await rollup(options, context);

  return { options, context };

}


export function execute(
  options: RollupBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {

  context.reportProgress(2, 5, 'ngc');
  return from(build(options, context)).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<RollupBuilderSchema>(execute);