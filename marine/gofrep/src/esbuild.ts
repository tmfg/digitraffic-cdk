import { createEsbuildConfig, saveMetadata } from "@digitraffic-cdk/esbuild";
import * as esbuild from "esbuild";

const esbuildConfig = await createEsbuildConfig();
const result = await esbuild.build(esbuildConfig);
await saveMetadata(result);
