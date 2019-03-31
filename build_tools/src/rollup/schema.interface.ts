export interface RollupBuilderSchema {
  tsConfig: string;
  rollupConfig: string;
  watch?: boolean;
  step: number;
  tally: number;
}