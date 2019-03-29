import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { json } from '@angular-devkit/core';
import { resolve, normalize } from 'path';
import { Observable, from, of } from 'rxjs';
import { catchError, mapTo, map } from 'rxjs/operators';
import { RollupBuilderSchema } from './schema.interface';

import { exec } from 'child_process';

export function ngc(
  options: RollupBuilderSchema,
  root: string
): Promise<{}> {

    return new Promise((res, rej) => {
        exec(normalize(root + '/node_modules/.bin/ngc') +
            ' -p ' + options.tsConfig, {}, (error, stdout, stderr) => {
                if (stderr.includes('Error')) {
                    if (rej) rej(error);
                } else {
                    res(stderr);
                }

        });
    });

}


export function rollup(
  options: RollupBuilderSchema,
  root: string
): Promise<{}> {

    return new Promise((res, rej) => {
        exec(normalize(root + '/node_modules/.bin/rollup') +
            ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {
                if (stderr.includes('Error')) {
                    if (rej) rej(error);
                } else {
                    res(stderr);
                }

        });
    });
}

async function build(
  options: RollupBuilderSchema,
  root: string,
): Promise<RollupBuilderSchema> {

  await ngc(options, root);
  await rollup(options, root);

  return options;

}


export function execute(
  options: RollupBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return from(build(options, context.workspaceRoot)).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<RollupBuilderSchema>(execute);