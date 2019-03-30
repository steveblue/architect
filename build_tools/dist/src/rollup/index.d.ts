import { BuilderContext, BuilderOutput } from '@angular-devkit/architect/src/index2';
import { Observable } from 'rxjs';
import { RollupBuilderSchema } from './schema.interface';
export declare function compileMain(options: RollupBuilderSchema, context: BuilderContext): Promise<{}>;
export declare function ngc(options: RollupBuilderSchema, context: BuilderContext): Promise<{}>;
export declare function rollup(options: RollupBuilderSchema, context: BuilderContext): Promise<{}>;
export declare function execute(options: RollupBuilderSchema, context: BuilderContext): Observable<BuilderOutput>;
declare const _default: import("@angular-devkit/architect/src/internal").Builder<Record<string, string> & RollupBuilderSchema>;
export default _default;
