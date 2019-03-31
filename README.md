# Architect

Building with Rollup and Closure Compiler using Angular Architect.

This project allows you to do the following:

```bash
ng run app:rollup
```

builds workspace with Rollup.


```bash
ng run app:closure
```

builds workspace with Closure Compiler.

NOTE:

This is currently an additional step needed to bundle with Closure Compiler.

```
code ./node_modules/tslib/package.json
```

Add this line to the tslib package.json.

```
"es2015": "tslib.es6.js",
```



## Getting started

In the root directory run `yarn install` to get started.


Install the latest architect CLI.

```
npm i -g @angular-devkit/core@next @angular-devkit/architect@next @angular-devkit/architect-cli@next
```


## /build_tools

Builders are coded here.

In this directory run `yarn install` to get started.

```
yarn build
```
triggers a build.

```
yarn watch
```
runs typescript in --watch mode.

In the main repository root directory, run the 'rollup' or 'closure' build with Architect CLI.

```
architect build_repo:closure
```




This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Lazyloading

Lazyloading is possible with Rollup in this branch, however will require some postprocessing of the AOT compiled code to get it right. Lazyloading with Closure Compiler is also possible, however a method is needed for code splitting. Closure Compiler could make output chunks more optimal than Rollup.

A lazyloaded route typically looks like this.
```
{ path: '', loadChildren: './routes/lazy1/lazy1.module#Lazy1Module' }
```

This is well and good however AOT compilation spits out a module called `Lazy1ModuleNgFactory` in a file called `lazy1.module.ngfactory` and Rollup puts all modules in a single directory. Rollup also requires import syntax and system.js to be included on the page. `s.js` can be used instead of `system.js`:

```
() => import('./lazy1.module.ngfactory').then(m => m.Lazy1ModuleNgFactory)
```

Lazyloading with Closure Compiler is possible but requires some work to figure out code splitting.

The workflow that has worked in the past is as follows:

- bundle all modules separately with compiler.jar (main.js, lazy1.module.ngfactory.js, etc)
- use output manifest to find duplicate dependencies
- pull shared dependencies into vendor chunk
- load unique module dependencies into module chunk(s)
- write .conf file that configures closure compiler to bundle chunks
- run compiler.jar application to optimize project

Proposed new workflow:

- query project for lazyloaded modules
- find dependencies for each module
- pull shared dependencies into vendor chunk
- load unique dependencies into module chunk(s)
- write .conf file that configures closure compiler to bundle chunks
- run compiler.jar application to optimize project





