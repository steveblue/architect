
import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { resolve, normalize } from 'path';
import { exec } from 'child_process';
import { Observable, from, of } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';
import { Schema as RollupBuilderOptions } from './schema';

export function build(
  options: RollupBuilderOptions,
  root: string
): Promise<string> {

    return new Promise((res, rej) => {

          exec(normalize(root + '/node_modules/.bin/rollup') +
              ' -c ' + options.config, {silent: true}, (error, stdout, stderr) => {

                  if (stderr.includes('Error')) {
                      if (rej) rej(error);
                      //TODO: figure out how to hook into logging
                      //log.error(stderr);
                      console.log(stderr);

                  } else {
                      //log.message(stderr);
                      console.log(stderr);
                      res(stderr);
                  }

          });
      })
}

export function execute(
  options: RollupBuilderOptions,
  context: BuilderContext,
): Observable<BuilderOutput> {
  return from(build(options, context.workspaceRoot)).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export { RollupBuilderOptions };
export default createBuilder<Record<string, string> & RollupBuilderOptions>(execute);