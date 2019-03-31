import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec, spawn } from 'child_process';
import { normalize, join } from 'path';
import { writeFile, readFile } from 'fs';

import { Observable, of } from 'rxjs';
import { catchError, map, mapTo, concatMap } from 'rxjs/operators';

import { ClosureBuilderSchema } from './schema.interface';

export function rollupRxJS(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {

  return new Observable((observer) => {

    let editFile = (filePath) => {
      return new Promise((res) => {
        readFile(filePath, 'utf-8', (error, stdout) => {
          let pack = JSON.parse(stdout);
          pack.es2015 = pack.es2015.replace('_esm2015', '_fesm2015');
          //log.message('editing ' + filePath);
          writeFile(filePath, JSON.stringify(pack), () => {
            res(filePath);
          })
        });
      });
    };

    let rollup;

    if (process.platform === 'win32') {
      rollup = spawn('cmd', ['/c', join(context.workspaceRoot, 'node_modules', '.bin', 'rollup'), '-c', join('rollup.rxjs.js')]);
    } else {
      rollup = spawn(join(context.workspaceRoot, 'node_modules', '.bin', 'rollup'), ['-c', join('rollup.rxjs.js')]);
    }

    rollup.stdout.on('data', (msg) => {
      //log.message(msg);
    });

    rollup.on('exit', () => {
      //log.message('rollup completed');
      Promise.all([editFile('node_modules/rxjs/package.json'),
      editFile('node_modules/rxjs/operators/package.json'),
      editFile('node_modules/rxjs/ajax/package.json'),
      editFile('node_modules/rxjs/testing/package.json'),
      editFile('node_modules/rxjs/webSocket/package.json')])
        .then(data => {
          context.reportProgress(options.step++, options.tally, 'rollup rxjs');
          observer.next();
        });

    });
  });
}

export function closure(
  options: ClosureBuilderSchema,
   context: BuilderContext
): Observable<{}> {

  return new Observable((observer) => {

    const jarPath = join('node_modules', 'google-closure-compiler-java', 'compiler.jar');
    const warningLevel = 'QUIET';
    const confPath = normalize('closure.conf');
    const outFile = './dist/build_repo/main.js';
    const manifestPath = normalize('closure/manifest.MF');

    exec(`java -jar ${jarPath} --warning_level=${warningLevel} --flagfile ${confPath} --js_output_file ${outFile} --output_manifest=${manifestPath}`,
        {},
        (error, stdout, stderr) => {
          context.reportStatus(stderr);
          context.reportProgress(options.step++, options.tally, 'closure');
          observer.next();
        });
    })
}

export function executeClosure(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  options.step = 0;
  options.tally = 5;
  return of(context).pipe(
    concatMap( results => ngc(options, context) ),
    concatMap( results => compileMain(options, context) ),
    concatMap( results => rollupRxJS(options, context) ),
    concatMap( results => closure(options, context) ),
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & ClosureBuilderSchema>(executeClosure);