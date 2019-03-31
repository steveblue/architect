export interface ClosureBuilderSchema {
  tsConfig: string;
  closureConfig: string;
  compilationMode?: string;
  watch?: boolean;
  step: number;
  tally: number;
  jarPath?: string;
  warningLevel?: string;
  manifest?: string;
  outFile?: string;
}