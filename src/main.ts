import { ProgramACanvasApp } from "./app/ProgramACanvasApp";
import "./styles.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const debugRoot = document.querySelector<HTMLElement>("#debug-root");

if (!canvas || !debugRoot) {
  throw new Error("页面缺少 #game-canvas 或 #debug-root。");
}

const app = new ProgramACanvasApp(canvas, debugRoot);
window.programA = app.debugApi;
window.programAIntegrations = {
  ...window.programAIntegrations,
  programB: app.debugApi.programB.runtimeBinding,
  programC: app.debugApi.programC.integration,
};

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

