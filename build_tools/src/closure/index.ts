import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec, spawn } from 'child_process';
import { normalize, join } from 'path';
import { writeFile, readFile } from 'fs';

import { Observable, defer } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

import { ClosureBuilderSchema } from './schema.interface';

export function rollupRxJS(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Promise<{}> {

  return new Promise((res, rej) => {

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
          res();
        });

    });
  });
}

export function closure(
  options: ClosureBuilderSchema,
   context: BuilderContext
): Promise<{}> {

  return new Promise((res, rej) => {

    const jarPath = join('node_modules', 'google-closure-compiler-java', 'compiler.jar');
    const warningLevel = 'QUIET';
    const confPath = normalize('closure.conf');
    const outFile = './dist/build_repo/main.js';
    const manifestPath = normalize('closure/manifest.MF');

    exec(`java -jar ${jarPath} --warning_level=${warningLevel} --flagfile ${confPath} --js_output_file ${outFile} --output_manifest=${manifestPath}`,
        {},
        (error, stdout, stderr) => {
            //log.stop('closure compiler');
            console.log(error, stdout, stderr);
            if (res) {
              context.reportProgress(5, 5, stderr);
              res();
            }

        });
    })
}

export function executeClosure(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  context.reportProgress(1, 5, 'ngc');
  return defer(async function(): Promise<{}> {

    await ngc(options, context);
    await compileMain(options, context);
    await rollupRxJS(options, context);
    await closure(options, context);

    return { options, context };

  }).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & ClosureBuilderSchema>(executeClosure);