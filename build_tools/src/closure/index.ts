import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec } from 'child_process';
import { normalize, join } from 'path';
import { readFileSync } from 'fs';

import { Observable, of } from 'rxjs';
import { catchError, mapTo, concatMap } from 'rxjs/operators';

import { ClosureBuilderSchema } from './schema.interface';

export function closure(
   options: ClosureBuilderSchema,
   context: BuilderContext
): Observable<{}> {
  context.reportStatus('closure');
  return new Observable((observer) => {

    const target = context.target ? context.target : { project: 'app' };
    const jarPath = options.jarPath ? options.jarPath : join('node_modules', 'google-closure-compiler-java', 'compiler.jar');
    const warningLevel = options.warningLevel ? options.warningLevel : 'QUIET';
    const confPath = options.closureConfig  ? normalize(options.closureConfig) : normalize('closure.conf');
    const outFile = options.outFile  ? options.outFile : `./dist/${target.project}/main.js`;
    const manifestPath = options.manifest  ? normalize(options.manifest) :  normalize('closure/manifest.MF');

    exec(`java -jar ${jarPath} --warning_level=${warningLevel} --flagfile ${confPath} --js_output_file ${outFile} --output_manifest=${manifestPath}`,
        {},
        (error, stdout, stderr) => {
          if (stderr.includes('ERROR')) {
            observer.error(error);
          }
          context.reportProgress(options.step++, options.tally, 'closure');
          observer.next(stdout);
        });
    })
}

export function executeClosure(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {

  const tsConfig = JSON.parse(readFileSync(join(context.workspaceRoot, options.tsConfig), 'utf8'));

  if (!options.compilationMode) {
    options.compilationMode = tsConfig.angularCompilerOptions && tsConfig.angularCompilerOptions.enableIvy ? 'ivy' : 'aot';
  }

  options.step = 0;
  options.tally = 3;

  return of(context).pipe(
    concatMap( results => ngc(options, context) ),
    (options.compilationMode !== 'aot') ? concatMap( results => of(results) ) : concatMap( results => compileMain(options, context) ),
    concatMap( results => closure(options, context) ),
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & ClosureBuilderSchema>(executeClosure);