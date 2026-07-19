const PROGRAM_A_ASSET_ROOT = "/assets/program-a";
const DESK_ASSET_ROOT = `${PROGRAM_A_ASSET_ROOT}/desk`;

// The source drop used the folder name `monotor`. Keep that filesystem path
// isolated here so scenes and views use correctly named semantic asset keys.
const LEGACY_MONITOR_ASSET_ROOT = `${PROGRAM_A_ASSET_ROOT}/monotor`;

export const DESK_ASSET_URLS = Object.freeze({
  background: `${DESK_ASSET_ROOT}/工位桌面竖屏素材.png`,
  monitor: `${DESK_ASSET_ROOT}/复古CRT监控显示器_屏幕留空透明.png`,
  desktopWallpaper: `${DESK_ASSET_ROOT}/call_Xuss14qrtzSYzUl2JtjQTRu3.png`,
  pendingStack: `${DESK_ASSET_ROOT}/blank-a4-document-stack-480x400.png`,
  operationTray: `${DESK_ASSET_ROOT}/data-submission-tray-angled-480x400.png`,
  newspaper: `${DESK_ASSET_ROOT}/新闻.png`,
  cameraOff: `${DESK_ASSET_ROOT}/camera-off-transparent.png`,
});

export type DeskAssetKey = keyof typeof DESK_ASSET_URLS;

export const MONITOR_DESKTOP_ASSET_URLS = Object.freeze({
  wallpaper: DESK_ASSET_URLS.desktopWallpaper,
  "data-processing":
    `${LEGACY_MONITOR_ASSET_ROOT}/program-a-app-data-processing-256.png`,
  "buyer-trade":
    `${LEGACY_MONITOR_ASSET_ROOT}/program-a-app-buyer-trade-256.png`,
  "risk-record":
    `${LEGACY_MONITOR_ASSET_ROOT}/program-a-app-risk-record-256.png`,
});

export type MonitorDesktopAssetKey =
  keyof typeof MONITOR_DESKTOP_ASSET_URLS;

