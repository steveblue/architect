import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { json } from '@angular-devkit/core';
import { resolve, normalize } from 'path';
import { exec } from 'child_process';
import { Observable, from, of } from 'rxjs';
import { catchError, mapTo, map } from 'rxjs/operators';


async function initialize(
  options: any,
  root: string,
): <any> {
  return of(options);
}

export function ngc(
  options: any,
  root: string
): Observable<Promise<{}>> {

    const async = new Promise((res, rej) => {

          exec(normalize(root + '/node_modules/.bin/ngc') +
              ' -p ' + options.tsConfig, {}, (error, stdout, stderr) => {

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
      });

    return of(async);
}


export function rollup(
  options: any,
  root: string
): Observable<Promise<{}>> {

    const async = new Promise((res, rej) => {

          exec(normalize(root + '/node_modules/.bin/rollup') +
              ' -c ' + options.rollupConfig, {}, (error, stdout, stderr) => {

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
      });

    return of(async);
}

export function execute(
  options: any,
  context: BuilderContext
): Observable<BuilderOutput> {
  return initialize(options).pipe(
    map(options => options.tsConfig ? ngc(options, context.workspaceRoot)),
    map(ngc => rollup(options, context.workspaceRoot)),
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<any>(execute);