export interface RollupBuilderSchema {
  tsConfig: string;
  rollupConfig: string;
  compilationMode?: string;
  watch?: boolean;
  step: number;
  tally: number;
}