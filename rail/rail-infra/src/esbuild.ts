import {
  createEsbuildConfig,
  saveMetadataAndAnalyze,
} from "@digitraffic-cdk/esbuild";
import * as esbuild from "esbuild";

const esbuildConfig = await createEsbuildConfig();
const result = await esbuild.build(esbuildConfig);
await saveMetadataAndAnalyze(result);
