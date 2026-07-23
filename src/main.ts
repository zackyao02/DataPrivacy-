import { ProgramACanvasApp } from "./app/ProgramACanvasApp";
import { resolveRuntimeAdapters } from "./adapters/RuntimeAdapters";
import "./styles.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const debugRoot = document.querySelector<HTMLElement>("#debug-root");

if (!canvas || !debugRoot) {
  throw new Error("页面缺少 #game-canvas 或 #debug-root。");
}

const runtimeAdapters = resolveRuntimeAdapters(window.programAIntegrations);
const app = new ProgramACanvasApp(canvas, debugRoot, runtimeAdapters.options);
window.programA = app.debugApi;
window.programAIntegrationStatus = runtimeAdapters.status;

console.info(
  `[Program A] adapter mode: ${runtimeAdapters.status.mode}`,
  runtimeAdapters.status,
);
runtimeAdapters.status.warnings.forEach((warning) => console.warn(warning));

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.destroy();
  });
}

declare global {
  interface Window {
    programA: ProgramACanvasApp["debugApi"];
  }
}
