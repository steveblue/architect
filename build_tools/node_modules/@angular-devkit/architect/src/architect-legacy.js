"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * @deprecated
 */
class ProjectNotFoundException extends core_1.BaseException {
    constructor(projectName) {
        super(`Project '${projectName}' could not be found in Workspace.`);
    }
}
exports.ProjectNotFoundException = ProjectNotFoundException;
/**
 * @deprecated
 */
class TargetNotFoundException extends core_1.BaseException {
    constructor(projectName, targetName) {
        super(`Target '${targetName}' could not be found in project '${projectName}'.`);
    }
}
exports.TargetNotFoundException = TargetNotFoundException;
/**
 * @deprecated
 */
class ConfigurationNotFoundException extends core_1.BaseException {
    constructor(projectName, configurationName) {
        super(`Configuration '${configurationName}' could not be found in project '${projectName}'.`);
    }
}
exports.ConfigurationNotFoundException = ConfigurationNotFoundException;
// TODO: break this exception apart into more granular ones.
/**
 * @deprecated
 */
class BuilderCannotBeResolvedException extends core_1.BaseException {
    constructor(builder) {
        super(`Builder '${builder}' cannot be resolved.`);
    }
}
exports.BuilderCannotBeResolvedException = BuilderCannotBeResolvedException;
/**
 * @deprecated
 */
class ArchitectNotYetLoadedException extends core_1.BaseException {
    constructor() { super(`Architect needs to be loaded before Architect is used.`); }
}
exports.ArchitectNotYetLoadedException = ArchitectNotYetLoadedException;
/**
 * @deprecated
 */
class BuilderNotFoundException extends core_1.BaseException {
    constructor(builder) {
        super(`Builder ${builder} could not be found.`);
    }
}
exports.BuilderNotFoundException = BuilderNotFoundException;
/**
 * @deprecated
 */
class Architect {
    constructor(_workspace) {
        this._workspace = _workspace;
        this._targetsSchemaPath = core_1.join(core_1.normalize(__dirname), 'targets-schema.json');
        this._buildersSchemaPath = core_1.join(core_1.normalize(__dirname), 'builders-schema.json');
        this._architectSchemasLoaded = false;
        this._targetMapMap = new Map();
        this._builderPathsMap = new Map();
        this._builderDescriptionMap = new Map();
        this._builderConstructorMap = new Map();
    }
    loadArchitect() {
        if (this._architectSchemasLoaded) {
            return rxjs_1.of(this);
        }
        else {
            return rxjs_1.forkJoin(this._loadJsonFile(this._targetsSchemaPath), this._loadJsonFile(this._buildersSchemaPath)).pipe(operators_1.concatMap(([targetsSchema, buildersSchema]) => {
                this._targetsSchema = targetsSchema;
                this._buildersSchema = buildersSchema;
                this._architectSchemasLoaded = true;
                // Validate and cache all project target maps.
                return rxjs_1.forkJoin(...this._workspace.listProjectNames().map(projectName => {
                    const unvalidatedTargetMap = this._workspace.getProjectTargets(projectName);
                    return this._workspace.validateAgainstSchema(unvalidatedTargetMap, this._targetsSchema).pipe(operators_1.tap(targetMap => this._targetMapMap.set(projectName, targetMap)));
                }));
            }), operators_1.map(() => this));
        }
    }
    listProjectTargets(projectName) {
        return Object.keys(this._getProjectTargetMap(projectName));
    }
    _getProjectTargetMap(projectName) {
        if (!this._targetMapMap.has(projectName)) {
            throw new ProjectNotFoundException(projectName);
        }
        return this._targetMapMap.get(projectName);
    }
    _getProjectTarget(projectName, targetName) {
        const targetMap = this._getProjectTargetMap(projectName);
        const target = targetMap[targetName];
        if (!target) {
            throw new TargetNotFoundException(projectName, targetName);
        }
        return target;
    }
    getBuilderConfiguration(targetSpec) {
        const { project: projectName, target: targetName, configuration: configurationName, overrides, } = targetSpec;
        const project = this._workspace.getProject(projectName);
        const target = this._getProjectTarget(projectName, targetName);
        const options = target.options;
        let configuration = {};
        if (configurationName) {
            if (!target.configurations) {
                throw new ConfigurationNotFoundException(projectName, configurationName);
            }
            configuration = target.configurations[configurationName];
            if (!configuration) {
                throw new ConfigurationNotFoundException(projectName, configurationName);
            }
        }
        const builderConfiguration = {
            root: project.root,
            sourceRoot: project.sourceRoot,
            projectType: project.projectType,
            builder: target.builder,
            options: Object.assign({}, options, configuration, overrides),
        };
        return builderConfiguration;
    }
    run(builderConfig, partialContext = {}) {
        const context = Object.assign({ logger: new core_1.logging.NullLogger(), architect: this, host: this._workspace.host, workspace: this._workspace }, partialContext);
        let builderDescription;
        return this.getBuilderDescription(builderConfig).pipe(operators_1.tap(description => builderDescription = description), operators_1.concatMap(() => this.validateBuilderOptions(builderConfig, builderDescription)), operators_1.tap(validatedBuilderConfig => builderConfig = validatedBuilderConfig), operators_1.map(() => this.getBuilder(builderDescription, context)), operators_1.concatMap(builder => builder.run(builderConfig)));
    }
    getBuilderDescription(builderConfig) {
        // Check cache for this builder description.
        if (this._builderDescriptionMap.has(builderConfig.builder)) {
            return rxjs_1.of(this._builderDescriptionMap.get(builderConfig.builder));
        }
        return new rxjs_1.Observable((obs) => {
            // TODO: this probably needs to be more like NodeModulesEngineHost.
            const basedir = core_1.getSystemPath(this._workspace.root);
            const [pkg, builderName] = builderConfig.builder.split(':');
            const pkgJsonPath = node_1.resolve(pkg, { basedir, resolvePackageJson: true, checkLocal: true });
            let buildersJsonPath;
            let builderPaths;
            // Read the `builders` entry of package.json.
            return this._loadJsonFile(core_1.normalize(pkgJsonPath)).pipe(operators_1.concatMap((pkgJson) => {
                const pkgJsonBuildersentry = pkgJson['builders'];
                if (!pkgJsonBuildersentry) {
                    return rxjs_1.throwError(new BuilderCannotBeResolvedException(builderConfig.builder));
                }
                buildersJsonPath = core_1.join(core_1.dirname(core_1.normalize(pkgJsonPath)), pkgJsonBuildersentry);
                return this._loadJsonFile(buildersJsonPath);
            }), 
            // Validate builders json.
            operators_1.concatMap((builderPathsMap) => this._workspace.validateAgainstSchema(builderPathsMap, this._buildersSchema)), operators_1.concatMap((builderPathsMap) => {
                builderPaths = builderPathsMap.builders[builderName];
                if (!builderPaths) {
                    return rxjs_1.throwError(new BuilderCannotBeResolvedException(builderConfig.builder));
                }
                // Resolve paths in the builder paths.
                const builderJsonDir = core_1.dirname(buildersJsonPath);
                builderPaths.schema = core_1.join(builderJsonDir, builderPaths.schema);
                builderPaths.class = core_1.join(builderJsonDir, builderPaths.class);
                // Save the builder paths so that we can lazily load the builder.
                this._builderPathsMap.set(builderConfig.builder, builderPaths);
                // Load the schema.
                return this._loadJsonFile(builderPaths.schema);
            }), operators_1.map(builderSchema => {
                const builderDescription = {
                    name: builderConfig.builder,
                    schema: builderSchema,
                    description: builderPaths.description,
                };
                // Save to cache before returning.
                this._builderDescriptionMap.set(builderDescription.name, builderDescription);
                return builderDescription;
            })).subscribe(obs);
        });
    }
    validateBuilderOptions(builderConfig, builderDescription) {
        return this._workspace.validateAgainstSchema(builderConfig.options, builderDescription.schema).pipe(operators_1.map(validatedOptions => {
            builderConfig.options = validatedOptions;
            return builderConfig;
        }));
    }
    getBuilder(builderDescription, context) {
        const name = builderDescription.name;
        let builderConstructor;
        // Check cache for this builder.
        if (this._builderConstructorMap.has(name)) {
            builderConstructor = this._builderConstructorMap.get(name);
        }
        else {
            if (!this._builderPathsMap.has(name)) {
                throw new BuilderNotFoundException(name);
            }
            const builderPaths = this._builderPathsMap.get(name);
            // TODO: support more than the default export, maybe via builder#import-name.
            const builderModule = require(core_1.getSystemPath(builderPaths.class));
            builderConstructor = builderModule['default'];
            // Save builder to cache before returning.
            this._builderConstructorMap.set(builderDescription.name, builderConstructor);
        }
        const builder = new builderConstructor(context);
        return builder;
    }
    _loadJsonFile(path) {
        return this._workspace.host.read(core_1.normalize(path)).pipe(operators_1.map(buffer => core_1.virtualFs.fileBufferToString(buffer)), operators_1.map(str => core_1.parseJson(str, core_1.JsonParseMode.Loose)));
    }
}
exports.Architect = Architect;
