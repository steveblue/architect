import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { compileMain, ngc } from './../util';

import { exec } from 'child_process';
import { normalize, join } from 'path';
import { readFileSync, readFile } from 'fs';
import { glob } from 'glob';
import * as ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import { Observable, of, from } from 'rxjs';
import { catchError, map, mapTo, concatMap, mergeMap } from 'rxjs/operators';

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

    const cmd = `java -jar ${jarPath} --warning_level=${warningLevel} --flagfile ${confPath} --js_output_file ${outFile} --output_manifest=${manifestPath}`;

    exec(cmd,
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

export function queryAST(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {

  const LOAD_CHILDREN_SPLIT = '#';
  const LOAD_CHILDREN_VALUE_QUERY = `StringLiteral[value=/.*${LOAD_CHILDREN_SPLIT}.*/]`;
  const LOAD_CHILDREN_ASSIGNMENT_QUERY = `PropertyAssignment:not(:has(Identifier[name="children"])):has(Identifier[name="loadChildren"]):has(${LOAD_CHILDREN_VALUE_QUERY})`;

  return new Observable((observer) => {
      glob('src/**/*.ts', options, function (err, files) {
        if (err) observer.error(err);
        console.log(files);
        files.forEach(fileName => {
          // Parse a file
          const query = tsquery(ts.createSourceFile(
            fileName,
            readFileSync(fileName).toString(),
            ts.ScriptTarget.ES2015
          ), LOAD_CHILDREN_ASSIGNMENT_QUERY);

          if (query.length) {
            console.log(query);
          }

        });
        observer.next();
      })
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
    concatMap( results => queryAST(options, context) ),
    concatMap( results => closure(options, context) ),
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & ClosureBuilderSchema>(executeClosure);