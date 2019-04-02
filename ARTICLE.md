I 🤓out on build tooling.

Since Angular 2 was in released I've been experimenting with different ways to build apps. Most developers don't need to worry about how their application is built because @angular/cli makes it so easy. The cli hides all the complexity and for good reason. Engineers need to focus on implementing features and bugfixes. Let's face it. Building complex enterprise applications is difficult. It can be a lot of work to put all the pieces together, let alone make build tooling do things like code split an application.

In Build Angular Like An Architect (Part 1) we look at why someone would want to write a custom Angular build. I then detail how to code a new Builder with @angular-devkit and execute the Builder with the Architect CLI.

You can check out the final code [in this Github repository](https://github.com/steveblue/architect).

### How did we get here?

Ever since the @angular/cli moved to webpack it was hard to integrate with other build tooling and still retain the benefits of the cli. Only a few efforts have been made to extend the cli. [nx](https://nx.dev) is one example, going as far to enable faster development in a monorepo, incrementally building only code that has changed.

The cli was so tightly coupled with webpack at times it led to awkward customization of webpack itself.

![eject](https://media.giphy.com/media/JGF7ctowtLGak/giphy.gif)

Prior to Angular 6 you could eject the webpack config with `ng eject` to customize it.

With the release of Angular 6 this API was deprecated when a complete rewrite of @angular/cli abstracted portions of the tool. The cli became a wrapper around @angular-devkit. Running a `ng` command just meant you were triggering "architect" targets that ran "builders". This kind of abstraction makes tools like nx possible.

- Builders allow you to code custom builds with TypeScript
- Architect lets you to define targets that run Builders.

Advanced users could customize a their tooling enough to provide a custom webpack config by coding a Builder and using Architect to establish targets that execute the Builder. If you did though you ran the risk of breaking changes in the API which was due to become stable in Angular 8. @angular-devkit/architect was considered experimental, that is up until [commits like this one](https://github.com/angular/angular-cli/commit/e41e10d313ad49e632ed1f9d6e7e563b3eb2fd09) landed in the @angular/cli repository on Github.

# @angular-devkit/architect is stable!

This is such a game changer for one reason alone. @angular/cli is becoming extensible.

![](https://media.giphy.com/media/kVRBvsiOyBM8o/giphy.gif)

Builders allow us to extend the Angular CLI to build Angular however we want!

Here are a few examples of how you could extend the CLI with a Builder.


- Run unit tests with Jest instead of Karma
- Execute e2e tests with TestCafe instead of Selenium and Protractor
- Optimize production bundles with Closure Compiler instead of Webpack and Terser
- Use a custom node server
- Provide a custom Webpack config like [@angular-devkit/build-webpack](https://github.com/angular/angular-cli/tree/master/packages/angular_devkit/build_webpack)


When using the Builder API we get all these wonderful features / behaviors out of the box!

- RxJS Observables
- Composable
- Testable
- Loggers
- Progress tracking
- Error reporters
- Schedulers

In this tutorial we look at building Angular by coding a Builder that optimizes an application with Closure Compiler.


## Enter Closure Compiler

@angular/cli is dependent on webpack and terser for bundling and optimizing JavaScript. These tools do an excellent job, but there is another that does even better.

[Closure Compiler](https://developers.google.com/closure/compiler/) is a tool used at Google for optimizing JavaScript for production. From the official website:

> Closure Compiler is a tool for making JavaScript download and run faster. Instead of compiling from a source language to machine code, it compiles from JavaScript to better JavaScript. It parses your JavaScript, analyzes it, removes dead code and rewrites and minimizes what's left. It also checks syntax, variable references, and types, and warns about common JavaScript pitfalls.

At ng-conf 2017 the Angular team announced the AOT compiler is compatible with Closure Compiler in Angular 4. The AOT compiler converts TypeScript type annotations to JSDoc style annotations Closure Compiler can interpret using a compiler flag (`annotateForClosureCompiler`). Behind the scenes a tool called tsickle converts the annotations. This feature would enable wide adoption of Angular at Google where teams are mandated to optimize JavaScript with Closure Compiler.


![](https://media.giphy.com/media/3SBi8gMf8BqBG/giphy.gif)


The Angular community was rallying around webpack at ng-conf 2017, however I was naturally curious about Closure Compiler. At development conferences you might find me listening in on a talk, typing away on my laptop experimenting with something I just learned about. At ng-conf 2017 I put together a proof of concept where I could bundle Angular with Closure Compiler. The results were impressive. I kept going and abstracted the steps into another cli tool called `ngr`. That's because ...

# Every bundle I throw at Closure Compiler optimizes better than Webpack and Uglify.
(and Terser)



![](https://media.giphy.com/media/l3q2DgSFjbAyseViM/giphy.gif)

That statement comes with a few caveats.

Angular must be built ahead of time (AOT) and the ahead of time compiled code. Closure Compiler must be in ADVANCED_OPTIMIZATIONS mode to ensure the smallest bundle possible. It also doesn't hurt to use @angular-devkit/build-optimizer. When the new Ivy compiler is final (Angular 9) we will see even better optimizations, but for now we have the AOT compiler.

The Angular community is quite fortunate that Angular has been compatible with Closure Compiler since Angular 4. React engineers have tried and failed to get React to optimize with Closure Compiler in ADVANCED_OPTIMIZATIONS mode, concluding ["it'll be more trouble than it's worth at this point"](https://github.com/facebook/react/issues/11092). Everyone in the JavaScript community should be able to optimize code with such an incredible tool. It does take a lot of annotation to reap the rewards of ADVANCED_OPTIMIZATIONS, a mode in Closure Compiler that is very aggressive to achieve the highest compression possible. If we are diligent in maintaining a type safe TypeScript application, tsickle does all the work for us.

It would be much easier to adopt Closure Compiler if the tool was available in @angular/cli.

Let's extend the cli to use Closure Compiler!

## How to build Angular with Architect CLI

In next section, we look at the essential files needed to scaffold a Builder and the Architect targets necessary to bundle a simple Angular app with Closure Compiler. The concepts presented in this section could be extended for any Builder. At some point I wouldn't be surprised to see a schematic that makes scaffolding a Builder much easier, but for now we will create the files ourselves.

### Intro

First let's outline the steps we can take to build Angular.

| step | description | tool |
|---|---|---|
| compile  |  compiles the app ahead of time  | @angular/compiler |
| optimize  | remove unnecessary byproducts of compilation w/ (optional) | @angular-devkit/build_optimizer |
| handle env | use the environments provided by cli (optional)  |  custom script |
| bundle  |  bundle and mangle the AOT compiled code | google-closure-compiler |

To build an Angular app for production we need to use the @angular/compiler-cli. If we were to do this manually we would evoke the compiler using the `ngc` command.

```
ngc -p src/tsconfig.app.json
```

This will output the AOT compiled application in the out-tsc directory, coincidentally where the cli puts it by default in a production build. That's because that is how the `outDir` is configured in src/tsconfig.app.json : `"outDir": "../out-tsc/app",`

We can optimize the application prior to bundling with @angular-devkit/build-optimizer. This package removes some code the compiler spit out that is not necessary, like the decorators we used in development.

@angular/cli has this concept of environments where engineers can `import { environment } from './environment'`.  `environment` is an Object with configuration for each environment. To make a custom build friendly with @angular/cli we should support this API as well. Basically what needs to happen is the content of `environment.js` in the out-tsc directory needs to be swapped out with `environment.${env}.js` .

To bundle with Closure Compiler we need a new configuration file: closure.conf. More on this later. Closure Compiler is a Java application distributed in `google-closure-compiler-java` package. Closure Compiler also provides a JavaScript API but in practice I've found the Java implementation to be more reliable.


![](https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif)


You want me to build my JavaScript project with Java?

Yes, Closure Compiler makes more performant bundles!

To manually run the Closure Compiler application we can use arguments on the command line.

```
java -jar ${jarPath} --flagFile ${confFile} --js_output_file ${outFile}
```

That's it! In this tutorial we will take care of the mandatory steps 1 and 4, running the AOT compiler and closure compiler.

In Build Angular like an Architect (Part 2) we add environments and optimize the bundle even more with @angular-devkit/build-optimizer. If you want a sneak peak at how this is done, [check out the Github repository](https://github.com/steveblue/architect/blob/master/build_tools/src/util.ts).


### Getting Started

Install the latest cli and architect packages globally using the `next`  version. The stable Architect CLI is only available in the latest releases.

Architect development relies on node > 10.14.1. Check which version of node you are running with `which node` and update node accordingly.

```bash

npm i -g @angular/cli@next @angular-devkit/architect@next @angular-devkit/architect-cli@next
```

Create a new application workspace with @angular/cli.

```
ng new build_repo
```

We called the application build_repo.

If you don't already have it installed, also download and install  [latest Java SDK from Oracle](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html
). This will allow us to run the Closure Compiler Java application.

Install Closure Compiler and tsickle in the project workspace.

```
npm i google-closure-compiler tsickle --save-dev
```

### build_tools

Make a new directory called `build_tools` in the root of your project.

Let's review the files we should have in the root directory.


| file  | description |
|---|---|
| build_tools   |  workspace for coding Builders  |
| angular.json  |  Angular app workspace configuration  |


Create several new files in the `build_tools` directory. Below is a description of what each file does.


| file  | description |
|---|---|
| package.json  |  installs dependencies, provides context for Builder  |
| tsconfig.json |  typescript project configuration  |
| builders.json |  schema for the Builders available in this package  |
| src/closure/schema.json  |  schema for a Closure Compiler Builder   |
| src/closure/index.ts  |  root file for a Closure Compiler Builder |
| src/index.ts  |  root file for Builder package source  |

Make a package.json in the build_tools directory. The file should look like the below example.

### package.json

```json
{
  "name": "build_tools",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@angular-devkit/architect": "^0.800.0-beta.10",
    "@angular-devkit/core": "^8.0.0-beta.10",
    "@types/node": "^11.12.1"
  },
  "builders": "builders.json"
}

```

The package.json is necessary for @angular/cli to establish the location of `builders.json` and also to install the dependencies needed to develop the Builder.

Run `npm install` in the build_tools directory.

Make a new index.ts file in the src directory. Here export everything from src/closure/index.ts.

```typescript
export * from './closure';
```

In the build_tools directory make a new builder.json file.

### builders.json

This file introduces schema for the Builders available in this package.

builders.json establishes the target Architect needs to point to each Builder. In this example the target is called 'closure' and it points to the Builder at './src/closure/index.js' and the Builder's schema is located at './src/closure/schema.json'.


```json
{
  "$schema": "@angular-devkit/architect/src/builders-schema.json",
  "builders": {
    "closure": {
      "implementation": "./src/closure/index",
      "class": "./src/closure",
      "schema": "./src/closure/schema.json",
      "description": "Build a Closure app."
    }
  }
}
```

### src/closure/schema.json

While on the topic of schema, we might as well declare the schema for the Closure Compiler Builder. Builder schema establishes the outward facing API for the Builder.

In './src/closure/schema.json' we define two required properties an engineer will need to provide in their workspace angular.json: `tsConfig` and `closureConfig`. These two properties map to the path of each configuration file: the tsconfig.json used to build Angular with the AOT compiler and the closure.conf used to bundle the application.


```json
{
  "$schema": "http://json-schema.org/schema",
  "title": "Closure Compiler Builder.",
  "description": "Closure Compiler Builder schema for Architect.",
  "type": "object",
  "properties": {
    "tsConfig": {
      "type": "string",
      "description": "The path to the Closure configuration file."
    },
    "closureConfig": {
      "type": "string",
      "description": "The path to the Closure configuration file."
    },
  },
  "additionalProperties": false,
  "required": [
    "tsConfig",
    "closureConfig"
  ]
}
```

### Intro to Builder API

src/closure/index.ts is where the Builder logic is located.

Builders are coded with TypeScript. The API that we need to use is mainly provided by @angular-devkit/architect and node. The awesome part of coding Builders is that the syntax is very familiar for anyone who codes an Angular application. Builders make heavy use of the Observable pattern from rxjs.

First, lets setup our imports.

`BuilderContext` will get passed to every step of the build process.

`BuilderOutput` is what finally returns from the Observable at the end of the process.

`createBuilder` is a method we call to create an instance of a Builder. Builders have an API that enable logging, progress trakcing and schemduling of builds.

We are going to make use of `Observable`, `of`, `catchError`, `mapTo`, and `concatMap` from rxjs.

 `exec`, `normalize` and `readFileSync` are imported from standard node packages (child_process, path, and fs respectively). These tools will allow us to execute commands like we entered them on the command line ('exec'), enables cross platform handling of file paths with methods like `normalize`, and `readFileSync` gives us the ability to read a file syncronously.


```javascript
import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect/src/index2';
import { Observable, of } from 'rxjs';
import { catchError, mapTo, concatMap } from 'rxjs/operators';
import { exec } from 'child_process';
import { normalize } from 'path';
import { readFileSync } from 'fs';
```

Next make a new file called schema.interface.ts in build_tools/src/closure and declare an interface for TypeScript that mirrors the json-schema we created earlier. There are ways to use the json-schema in lieu of a TypeScript interface, but for simplicity lets just declare the schema as an interface.

```
export interface ClosureBuilderSchema {
  tsConfig: string;
  closureConfig: string;
}
```

Import the new schema.

```javascript
import { ClosureBuilderSchema } from './schema.interface';
```

Next declare an export for the Builder and also the callback function that executes the build.

```javascript
export function executeClosure(
  options: ClosureBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return of(context).pipe(
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
}

export default createBuilder<Record<string, string> & ClosureBuilderSchema>(executeClosure);
```

`executeClosure` takes two arguments: `options` and `context`.

| argument  | description |
|---|---|
| options   |  options passed in from angular.json  |
| context |  context of the current executing Builder  |


`executeClosure` returns a rxjs `Observable`.

If the build is successful `mapTo` passes `{success: true}` to display feedback in the terminal.

If any step in the build process throws an error `catchError` will be called.


### Compiling the project source

In the build_tools directory add a tsconfig.json so we can compile the TypeScript we just coded.

```json
{
  "compileOnSave": false,
  "buildOnSave": false,
  "compilerOptions": {
    "baseUrl": "",
    "rootDir": ".",
    "target": "es2018",
    "module": "commonjs",
    "moduleResolution": "node",
    "noEmitOnError": true,
    "noImplicitAny": false,
    "removeComments": false,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "declaration": true
  },
  "lib": [
    "es2018"
  ],
  "typeRoots": [
    "./node_modules/@types"
  ],
  "types": [
    "node",
    "json-schema"
  ],
  "include": [
    "./src/**/*.ts"
  ],
  "exclude": [
    "./src/closure/schema.interface.ts"
  ]
}
```

In the build_tools directory use the `tsc` command to build the project.

```bash
tsc -p tsconfig.json
```

Alternatively, you could also run the watcher to build on every file change.

```
tsc -p tsconfig.json --watch
```

Now the project is built!

For the sake of simplicity in this example the files are compiled in place, but we could fix this by setting the `outDir` parameter on the `compilerOptions`. We would need to also copy any schema.json and package.json over to a distribution folder as well.


### Configuring angular.json

Back in the workspace of the project we scaffolded, configure the angular.json. We need to tell the project where to point  ClosureBuilder we just created.

Create a new property in the 'architect' configuration called 'closure_build'.

Set the new 'closure_build' object 'builder' property to './build_tools:closure'.

'./build_tools' because thats where the package.json for our Architect project is located and 'closure' because we want to run the Builder named 'closure'. We configured the builders.json found at './build_tools' in an earlier step. If the './build_tools' directory is published and we install the package via npm we could replace './build_tools' here with the package name.

Create another property on the 'closure' object and name it 'options'. In this object, configure the path to the closure configuration (we have yet to make) and the tsconfig for the angular project.

angular.json should look like this when you are done.

```json
"architect": {
  "closure_build": {
    "builder": "./build_tools:closure",
    "options": {
      "closureConfig": "closure.conf",
      "tsConfig": "src/tsconfig.app.json"
    }
  }
...

```

Using @angular-devkit/architect-cli package we installed globally earlier, test the Builder is working by passing the `architect` command the workspace name (build_repo) and the target we just established in angular.json (closure_build).

```bash
architect build_repo:closure_build
```

Architect should print SUCCESS in the terminal. You should see something like this.
```bash
SUCCESS
Result: {
    "success": true,
    "target": {
        "project": "build_repo",
        "target": "closure_build"
    }
}
```

### What is going on here?

The Architect CLI allows us to test the Builder works correctly in a workspace. The `architect` command is equivalent to `ng run` in any typical @angular/cli workspace. The reason we see SUCCESS is because all the builder is doing is mapping an Observable we created to the success message in ./build_tools/src/closure/index.ts.

```typescript
return of(context).pipe(
  mapTo({ success: true }),
  catchError(error => {
    context.reportStatus('Error: ' + error);
    return [{ success: false }];
  }),
);
```

We still need to code our build, but at least we know the scaffolding works!

To continue testing the build run, in `build_tools` directory run `tsc -p tsconfig.json --watch`.
In the root of the project, run `architect build_repo:closure_build` after each incremental build of typescript.


## Coding Builders with RxJS Observables and Node.js

Previously we established the ClosureBuilder will execute the build with the `executeClosure` method that returns an RxJS Observable. There is a problem we should consider with this approach. Observables are asynchronous, however builds often have a set of instructions that have to run synchronously. There are certainly use cases for asynchronously performing build tasks where Observables come in handy. We explore asynchronous use cases in later posts. For now we just need to execute a set of steps. To perform synchronous tasks with RxJS we employ the `concatMap` operator like in this example:

```typescript
  return of(context).pipe(
    concatMap( results => ngc(options, context)),
    concatMap( results => compileMain(options, context)),
    concatMap( results => closure(options, context) ),
    mapTo({ success: true }),
    catchError(error => {
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    }),
  );
```

In the above example the AOT compiler will execute, followed by a step for formatting the `main.js`, and finally a step that executes Closure Compiler to bundle and optimize the app.

The @angular/cli team apparently has the opinion that coding a Builder should seem familiar to anyone who codes an Angular application. Fans of isomorphism are swooning for the API!

We have a problem though because of this opinion, however it is an easy problem to solve.

Problem:

Node.js ❤️ Promises.

Builders ❤️ RxJS Observables.


Solution 1:

RxJS Observables are interoperable with Promises.

```typescript
of(new Promise)
```
is a thing. RxJs will convert Promises to Observables behind the scenes for us.

Solution 2:

We can convert Promise based workflows to Observables.

Consider this example we will use to evoke the AOT compiler with the Node.js `exec` method. The `ngc` method returns an `Observable`.

In the `Observable` callback, we pass the observer. The program runs exec, performing the `ngc -p tsconfig.app.json` command as if we entered it in the terminal.

If AOT compilation results in an Error, we call `observer.error()`.

If AOT compilation succeeds, we call `observer.next()`.

```typescript
export function ngc(
  options: AbstractBuilderSchema | RollupBuilderSchema | ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {

    return new Observable((observer) => {

        exec(normalize(context.workspaceRoot +'/node_modules/.bin/ngc') +
             ' -p ' + options.tsConfig,
             {},
             (error, stdout, stderr) => {
              if (stderr) {
                  observer.error(stderr);
              } else {
                  observer.next(stdout);
              }
        });

    });

}
```

When the above method gets inserted into the Observable map operator in `executeClosure`, the step will run!

```typescript
  return of(context).pipe(
    concatMap( results => ngc(options, context)),
```

Let's look at a few examples of build steps we execute to build an application with Closure Compiler.

We outlined the build steps earlier at a conceptual level, but let's look at them again in more detail.


### Angular Compiler

Angular is built ahead of time with the AOT compiler for production. AOT compilation results in smaller bundles, is more secure than JIT, and most important for our example, works with Closure Compiler! The AOT compiler translates TypeScript type annotations using a tool called tsickle.

To configure the AOT compiler to output the annotations Closure Compiler needs to optimize in ADVANCED_OPTIMIZATIONS mode, we add two configuration options in the Angular workspace tsconfig.app.json.

```json
"angularCompilerOptions": {
    "annotationsAs": "static fields",
    "annotateForClosureCompiler": true
}
```

Back in build_tools/src/closure/index.ts, import `exec` so we can execute the AOT compiler and `normalize` so any paths we use are cross platform compatible, meaning users running the build on Windows can also use our script.

```javascript
import { exec } from 'child_process';
import { normalize } from 'path';
```

Make a new function called ngc and give it two arguments: `options` and `context`. Every build step will take these two arguments in our example. `options` is the options the user passed in through angular.json, while `context` provides methods on the current `BuilderContext` we can use. We detail some of these methods in Part 2.

For now we return an `Observable` that calls `exec`, passes in an absolute path to `ngc` in our workspace and then uses the `-p` argument to pass in a TypeScript configuration.


```typescript

export function ngc(
  options: AbstractBuilderSchema | RollupBuilderSchema | ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {

    return new Observable((observer) => {

        exec(normalize(context.workspaceRoot +'/node_modules/.bin/ngc') +
             ' -p ' + options.tsConfig,
             {},
             (error, stdout, stderr) => {
              if (stderr) {
                  observer.error(stderr);
              } else {
                  observer.next(stdout);
              }
        });

    });

}
```

If we add this operation to the `executeClosure` function.

```typescript
  return of(context).pipe(
    concatMap( results => ngc(options, context)),
```

Build the project.

```bash
tsc -p tsconfig.json
```

In the Angular workspace we should be able to see a new directory called `out-tsc`  after we run the Architect CLI.

```bash
architect build_repo:closure_build
```

This directory will be filled with AOT compiled code that has the file extension `ngfactory.js`. All of our application logic has been compiled into these files.

If we look closely at the ahead of time compiled code, we will see a problem with the entry point of the Angular application in out-tsc/app/src/main.js.

```typescript
platformBrowserDynamic().bootstrapModule(AppModule)
```

The entry point is still referencing the `AppModule` found in out-tsc/app/src/app.module.js. We need our app to bootstrap with the ahead of time compiled  `AppModuleNgFactory` found in out-tsc/app/src/app.module.ngfactory.js instead.

@angular/cli takes care of this for us automatically when we run `ng serve` or `ng build`, Since we are coding a custom build, we need to transform the main.js ourselves.


### Format main.js

We need a way to read the source `main.ts` from disk, find and replace portions of the file content, compile the TypeScript and then write the transformed file to disk.

Luckily typescript is already a dependency of the project. We can just import it into build_tools/src/closure/index.ts.

For all of the file management tasks we have some handy Node.js functions (`readFileSync`, `writeFile`, and `readFile`) found in fs.

```javascript
import * as ts from 'typescript';
import { readFileSync, writeFile, readFile } from 'fs';
```

 This operation is a little bit more complex than the last example, but the format is the same. In the `compileMain` function we return an Observable again. The source main.ts is read from disk, the contents of the file are replaced, the content is then transpiled with the compilerOptions from the tsconfig we configured, and finally the file is written to disk in the out-tsc directory, replacing the file the AOT compiler originally output.


```typescript
export function compileMain(
  options: AbstractBuilderSchema | RollupBuilderSchema | ClosureBuilderSchema,
  context: BuilderContext
): Observable<{}> {

  return new Observable((observer) => {

      const inFile = normalize(context.workspaceRoot+'/src/main.ts');
      const outFile = normalize('out-tsc/app/src/main.js');
      const tsConfig = JSON.parse(readFileSync(join(context.workspaceRoot, options.tsConfig), 'utf8'));

      readFile(inFile, 'utf8', (err, contents) => {

          if (err) observer.error(err);

          contents = contents.replace(/platformBrowserDynamic/g, 'platformBrowser');
          contents = contents.replace(/platform-browser-dynamic/g, 'platform-browser');
          contents = contents.replace(/bootstrapModule/g, 'bootstrapModuleFactory');
          contents = contents.replace(/AppModule/g, 'AppModuleNgFactory');
          contents = contents.replace(/.module/g, '.module.ngfactory');

          const outputContent = ts.transpileModule(contents, {
            compilerOptions: tsConfig.compilerOptions,
            moduleName: 'app'
          })

          writeFile(outFile, outputContent.outputText, (err) => {
              if (err) observer.error(err);
              observer.next(outputContent.outputText);
          });

      });

  });
}
```

Add the `compileMain` method to the pipe.

```typescript
return of(context).pipe(
  concatMap( results => ngc(options, context) ),
  concatMap( results => compileMain(options, context) ),
}
```

Build the project.

```bash
tsc -p tsconfig.json
```

Run the Architect CLI.

```bash
architect build_repo:closure_build
```

The file at out-tsc/src/app/main.js should call a `bootstrapModuleFactory` method on `platformBrowser` and pass in the `AppModuleNgFactory`.

```javascript
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory)
```

Now the entry point for our bundle is properly formatted for AOT compilation we can run Closure Compiler.


### Closure Compiler

In order to build with Closure Compiler, we first need to write a configuration file called closure.conf in the root of the Angular workspace.

### closure.conf

The closure.conf file configures Closure Compiler in the following ways:

- sets optional parameters for the build (--compilation_level, --create_source_map, etc)
- declares dependencies and external files (--js and --externs)
- location of the source files (AOT compiled app in the /out-tsc directory)
- entry point for the bundle (--entry_point)
- options for resolving node packages (--module_resolution, --package_json_entry_names)

This particular closure.conf works with angular packages ~8.0.0-beta.10.


```bash
--compilation_level=ADVANCED_OPTIMIZATIONS
--language_out=ECMASCRIPT5
--variable_renaming_report=closure/variable_renaming_report
--property_renaming_report=closure/property_renaming_report
--create_source_map=%outname%.map

--warning_level=QUIET
--dependency_mode=STRICT
--rewrite_polyfills=false
--jscomp_off=checkVars

--externs node_modules/zone.js/dist/zone_externs.js

--js node_modules/tslib/package.json
--js node_modules/tslib/tslib.es6.js

--js node_modules/rxjs/package.json
--js node_modules/rxjs/_esm2015/index.js
--js node_modules/rxjs/_esm2015/internal/**.js
--js node_modules/rxjs/operators/package.json
--js node_modules/rxjs/_esm2015/operators/index.js

--js node_modules/@angular/core/package.json
--js node_modules/@angular/core/fesm2015/core.js

--js node_modules/@angular/common/package.json
--js node_modules/@angular/common/fesm2015/common.js

--js node_modules/@angular/platform-browser/package.json
--js node_modules/@angular/platform-browser/fesm2015/platform-browser.js

--js node_modules/@angular/forms/package.json
--js node_modules/@angular/forms/fesm2015/forms.js

--js node_modules/@angular/common/http/package.json
--js node_modules/@angular/common/fesm2015/http.js

--js node_modules/@angular/router/package.json
--js node_modules/@angular/router/fesm2015/router.js

--js node_modules/@angular/animations/package.json
--js node_modules/@angular/animations/fesm2015/animations.js

--js node_modules/@angular/animations/browser/package.json
--js node_modules/@angular/animations/fesm2015/browser.js

--js node_modules/@angular/platform-browser/animations/package.json
--js node_modules/@angular/platform-browser/fesm2015/animations.js

--js out-tsc/**.js

--module_resolution=node
--package_json_entry_names jsnext:main,es2015
--process_common_js_modules

--entry_point=./out-tsc/app/src/main.js
```

With the closure.conf in place, we can write a function in build_tools/src/closure/index.ts that executes the Java application in the google-closure-compiler-java package we installed earlier.

In this example, we begin working with the `BuilderContext`. We reference the current `target` and `project` to configure where the final bundle is output based on the configuration in angular.json.

```typescript
export function closure(
   options: ClosureBuilderSchema,
   context: BuilderContext
): Observable<{}> {

  return new Observable((observer) => {

    const target = context.target ? context.target : { project: 'app' };
    const jarPath = options.jarPath ? options.jarPath : join('node_modules', 'google-closure-compiler-java', 'compiler.jar');
    const confPath = options.closureConfig;
    const outFile = `./dist/${target.project}/main.js`;

    exec(`java -jar ${jarPath} --flagfile ${confPath} --js_output_file ${outFile}`,
        {},
        (error, stdout, stderr) => {
          if (stderr.includes('ERROR')) {
            observer.error(error);
          }
          observer.next(stdout);
        });
    })
}
```

Add the new `closure` function to the pipe in `executeClosure`.

```typescript

return of(context).pipe(
  concatMap( results => ngc(options, context) ),
  concatMap( results => compileMain(options, context) ),
  concatMap( results => closure(options, context) )
}
```

Build the project.

```bash
tsc -p tsconfig.json
```

Run the Architect CLI.

```bash
architect build_repo:closure_build
```

# GREAT SCOTT!

![](https://media.giphy.com/media/3o7aCRBQC8u5GaW092/giphy.gif)

## @angular/cli is optimizing a bundle with Closure Compiler!

Let's analyze the bundle that was created in a battle for the ages.

### Webpack vs. Closure Compiler


![](https://thepracticaldev.s3.amazonaws.com/i/oc2vdqxqoxv76c0dhbxo.png)

Webpack and Terser bundled and optimized the app ~43.3Kb(gzipped).

![](https://thepracticaldev.s3.amazonaws.com/i/r00tdlcrbumb4lfvzcmo.png)

Closure Compiler bundled and optimized the app ~37.3Kb (gzipped).

# ~14% reduction in bundle size

Thats a ~14% smaller bundle for this simple app! At scale that 14% can make a real tangible difference. These estimates include optimizations with @angular-devkit/build-optimizer and are served with gzip compression.

## Conclusion

In Build Angular like an Architect (Part 1) we looked at how to code a Builder and execute the build with the Architect CLI. We extended @angular/cli to optimize a production bundle with Closure Compiler.

The source code for [Build Angular Like An Architect is available on Github](https://github.com/steveblue/architect).

In my humble opinion, @angular-devkit/architect is the single largest improvement to the Angular CLI since schematics were released. We can now extend Angular CLI to perform any task we can imagine! Angular CLI is becoming so extensible it may be able to build any JavaScript project not just Angular.

That is an amazing feat for the Angular CLI team!


## There's more on the way!

![](https://media.giphy.com/media/xT1XGKfc0gwXshqA80/giphy.gif)

In Build Angular like an Architect (Part 2) we look at angular-devkit/build-optimizer, figure out how to implement environments, and explore more parts of BuilderContext useful for logging and progress tracking.

In Build Angular like an Architect (Part 3) we will learn how to write tests for the Builders we coded in Part 1-2.

In Build Angular like an Architect (Part 4) we code split an application so Closure Compiler can output multiple lazyloaded bundles.

Finally in Build Angular like an Architect (Part 5) we conclude this multi part series with a surprise, so stay tuned!

## What do you think?

What is your opinion of the new Architect CLI?

What do you think about the @angular/cli becoming extensible?