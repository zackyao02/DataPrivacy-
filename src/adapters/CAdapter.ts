import type { AudioPort } from "../game/GamePorts";

export interface PackagePreviewOptions {
  readonly onlyReady?: boolean;
}

export type BlackBoxLineStage =
  | "challenge_intro"
  | "challenge_success"
  | "challenge_fail"
  | "package_review"
  | "public_opinion"
  | "transaction_success"
  | "ending_pressure";

export interface CContentDebugPort {
  findPackagePreviews(
    cardIds: readonly string[],
    options?: PackagePreviewOptions,
  ): readonly unknown[];
  pickNewsForPackage(packageType: string): unknown;
  findChallengeByDay(day: number): unknown;
  findDataCleaningIcon(iconHint: string): unknown;
  pickPublicOpinionScript(packageType: string): unknown;
  pickProfilePuzzleByDay(day: number): unknown;
  pickBuyerNegotiationScript(packageType: string): unknown;
  findDailyMonologueByDay(day: number): unknown;
  pickBlackBoxLine(
    stage: BlackBoxLineStage,
    filters?: { readonly day?: number; readonly packageType?: string },
  ): unknown;
}

export interface CAdapterBindings {
  readonly audio: AudioPort;
  readonly contentDebug?: Partial<CContentDebugPort>;
}

export class CAdapter {
  constructor(private readonly bindings: CAdapterBindings) {}

  async unlock(): Promise<void> {
    await this.bindings.audio.unlock?.();
  }

  handleGameEvent(eventName: string): boolean {
    return this.bindings.audio.handleGameEvent(eventName) !== false;
  }

  findPackagePreviews(
    cardIds: readonly string[],
    options: PackagePreviewOptions = {},
  ): readonly unknown[] {
    return (
      this.bindings.contentDebug?.findPackagePreviews?.(cardIds, options) ?? []
    );
  }

  pickNewsForPackage(packageType: string): unknown | null {
    return (
      this.bindings.contentDebug?.pickNewsForPackage?.(packageType) ?? null
    );
  }

  findChallengeByDay(day: number): unknown | null {
    return this.bindings.contentDebug?.findChallengeByDay?.(day) ?? null;
  }

  findDataCleaningIcon(iconHint: string): unknown | null {
    return this.bindings.contentDebug?.findDataCleaningIcon?.(iconHint) ?? null;
  }

  pickPublicOpinionScript(packageType: string): unknown | null {
    return (
      this.bindings.contentDebug?.pickPublicOpinionScript?.(packageType) ?? null
    );
  }

  pickProfilePuzzleByDay(day: number): unknown | null {
    return this.bindings.contentDebug?.pickProfilePuzzleByDay?.(day) ?? null;
  }

  pickBuyerNegotiationScript(packageType: string): unknown | null {
    return (
      this.bindings.contentDebug?.pickBuyerNegotiationScript?.(packageType) ??
      null
    );
  }

  findDailyMonologueByDay(day: number): unknown | null {
    return (
      this.bindings.contentDebug?.findDailyMonologueByDay?.(day) ?? null
    );
  }

  pickBlackBoxLine(
    stage: BlackBoxLineStage,
    filters: { readonly day?: number; readonly packageType?: string } = {},
  ): unknown | null {
    return (
      this.bindings.contentDebug?.pickBlackBoxLine?.(stage, filters) ?? null
    );
  }
}

export class MockAudioPort implements AudioPort {
  private readonly events: string[] = [];

  handleGameEvent(eventName: string): boolean {
    this.events.push(eventName);
    console.info("[Program C mock audio] handleGameEvent(eventName)", eventName);
    return true;
  }

  unlock(): void {
    // The mock has no AudioContext, but mirrors Program C's mobile unlock API.
  }

  getHandledEvents(): readonly string[] {
    return [...this.events];
  }
}

export interface MockCAdapterBundle {
  readonly adapter: CAdapter;
  readonly audio: MockAudioPort;
}

export function createMockCAdapter(): MockCAdapterBundle {
  const audio = new MockAudioPort();
  return {
    audio,
    adapter: new CAdapter({ audio }),
  };
}
