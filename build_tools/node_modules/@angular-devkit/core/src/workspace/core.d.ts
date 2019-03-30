import { WorkspaceDefinition } from './definitions';
import { WorkspaceHost } from './host';
export declare enum WorkspaceFormat {
    JSON = 0
}
export declare function _test_addWorkspaceFile(name: string, format: WorkspaceFormat): void;
export declare function _test_removeWorkspaceFile(name: string): void;
export declare function readWorkspace(path: string, host: WorkspaceHost, format?: WorkspaceFormat): Promise<WorkspaceDefinition>;
export declare function writeWorkspace(workspace: WorkspaceDefinition, _host: WorkspaceHost, _path?: string, format?: WorkspaceFormat): Promise<void>;
