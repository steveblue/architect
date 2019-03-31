export interface AbstractBuilderSchema {
  tsConfig: string;
  rollupConfig?: string;
  watch: boolean;
  step: number;
  tally: number;
}