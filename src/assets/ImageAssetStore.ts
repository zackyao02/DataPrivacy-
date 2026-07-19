export interface ImageAssetStatus {
  readonly loaded: number;
  readonly failed: number;
  readonly total: number;
  readonly ready: boolean;
  readonly loadedKeys: readonly string[];
  readonly failedKeys: readonly string[];
}

interface ImageRecord {
  readonly image: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
}

export class ImageAssetStore<AssetKey extends string> {
  private readonly records = new Map<AssetKey, ImageRecord>();

  constructor(sources: Readonly<Record<AssetKey, string>>) {
    for (const [key, source] of Object.entries(sources) as [AssetKey, string][]) {
      const image = new Image();
      const record: ImageRecord = {
        image,
        loaded: false,
        failed: false,
      };

      image.decoding = "async";
      image.addEventListener(
        "load",
        () => {
          record.loaded = true;
        },
        { once: true },
      );
      image.addEventListener(
        "error",
        () => {
          record.failed = true;
        },
        { once: true },
      );
      image.src = source;
      this.records.set(key, record);
    }
  }

  get(assetKey: AssetKey): HTMLImageElement | null {
    const record = this.records.get(assetKey);
    return record?.loaded ? record.image : null;
  }

  getStatus(): ImageAssetStatus {
    const entries = [...this.records.entries()];
    const records = entries.map(([, record]) => record);
    const loaded = records.filter((record) => record.loaded).length;
    const failed = records.filter((record) => record.failed).length;

    return {
      loaded,
      failed,
      total: records.length,
      ready: loaded + failed === records.length,
      loadedKeys: entries
        .filter(([, record]) => record.loaded)
        .map(([key]) => key),
      failedKeys: entries
        .filter(([, record]) => record.failed)
        .map(([key]) => key),
    };
  }

  destroy(): void {
    for (const record of this.records.values()) {
      record.image.src = "";
    }

    this.records.clear();
  }
}
