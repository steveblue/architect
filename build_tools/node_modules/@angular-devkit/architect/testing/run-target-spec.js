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
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const src_1 = require("../src");
/**
 * @deprecated
 */
exports.DefaultTimeout = 45000;
/**
 * @deprecated
 */
function runTargetSpec(host, targetSpec, overrides = {}, timeout = exports.DefaultTimeout, logger = new core_1.logging.NullLogger()) {
    targetSpec = Object.assign({}, targetSpec, { overrides });
    const workspaceFile = core_1.normalize('angular.json');
    const workspace = new core_1.experimental.workspace.Workspace(host.root(), host);
    // Emit when runArchitect$ completes or errors.
    // TODO: There must be a better way of doing this...
    let finalizeCB = () => { };
    const runArchitectFinalize$ = new rxjs_1.Observable(obs => {
        finalizeCB = () => obs.next();
    });
    // Load the workspace from the root of the host, then run a target.
    const builderContext = {
        logger,
        targetSpecifier: targetSpec,
    };
    const runArchitect$ = workspace.loadWorkspaceFromHost(workspaceFile).pipe(operators_1.concatMap(ws => new src_1.Architect(ws).loadArchitect()), operators_1.concatMap(arch => arch.run(arch.getBuilderConfiguration(targetSpec), builderContext)), operators_1.finalize(() => finalizeCB()));
    // Error out after the timeout if runArchitect$ hasn't finalized.
    const timeout$ = rxjs_1.timer(timeout).pipe(operators_1.takeUntil(runArchitectFinalize$), operators_1.concatMapTo(rxjs_1.throwError(`runTargetSpec timeout (${timeout}) reached.`)));
    return rxjs_1.merge(timeout$, runArchitect$);
}
exports.runTargetSpec = runTargetSpec;
