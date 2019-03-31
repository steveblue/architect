export interface ClosureBuilderSchema {
  tsConfig: string;
  closureConfig: string;
  watch?: boolean;
  step: number;
  tally: number;
  jarPath?: string;
  warningLevel?: string;
  manifest?: string;
  outFile?: string;
}