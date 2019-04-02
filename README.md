# Architect

Building with Rollup and Closure Compiler using Angular Architect.

This repo accompanies the blog series [Build Angular Like An Architect on dev.to](https://dev.to/steveblue/build-angular-like-an-architect-part-1-3ph2
).


This project allows you to do the following:

```bash
architect build_repo:rollup
```

builds workspace with Rollup.


```bash
architect build_repo:closure_build
```

builds workspace with Closure Compiler.


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
