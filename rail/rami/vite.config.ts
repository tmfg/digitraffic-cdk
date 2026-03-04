import { defaultConfig } from "@digitraffic-cdk/testing";
import { defineConfig } from "vitest/config";

const config = { ...defaultConfig };

config.test.setupFiles = ["src/__test__/setup.ts"];

export default defineConfig(config);
