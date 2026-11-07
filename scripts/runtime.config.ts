// Copied to the shared runtime by `cutaway setup`. Maps @engine to the workspace's fresh engine copy.
import path from "node:path";
import {Config} from "@remotion/cli/config";

const ws = process.env.CUTAWAY_WS as string;
Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Rspack has its own override hook, separate from overrideWebpackConfig.
Config.overrideRspackConfig((c) => ({
  ...c,
  resolve: {...c.resolve, alias: {...((c.resolve?.alias as object) ?? {}), ...(ws ? {"@engine": path.join(ws, ".cutaway/engine")} : {})}},
}));
