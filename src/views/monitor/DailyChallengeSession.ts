import type { DailyChallengeResponse } from "../../game/GamePorts";
import type {
  VisibleDailyChallenge,
  VisibleDailyChallengeTask,
} from "../../game/VisibleGameState";

export class DailyChallengeSession {
  private challengeId: string | null = null;
  private kind: VisibleDailyChallenge["kind"] | null = null;
  private tasks: readonly VisibleDailyChallengeTask[] = [];
  private taskIndex = 0;
  private readonly selections = new Map<string, Set<string>>();

  sync(challenge: VisibleDailyChallenge | null): void {
    if (!challenge) {
      this.reset();
      return;
    }
    if (challenge.id === this.challengeId) {
      return;
    }
    this.challengeId = challenge.id;
    this.kind = challenge.kind;
    this.tasks = challenge.tasks;
    this.taskIndex = 0;
    this.selections.clear();
  }

  getCurrentTask(): VisibleDailyChallengeTask | null {
    return this.tasks[this.taskIndex] ?? null;
  }

  getTaskIndex(): number {
    return this.taskIndex;
  }

  getTaskCount(): number {
    return this.tasks.length;
  }

  getSelectedOptionIds(taskId: string): readonly string[] {
    return [...(this.selections.get(taskId) ?? [])];
  }

  isSelected(taskId: string, optionId: string): boolean {
    return this.selections.get(taskId)?.has(optionId) ?? false;
  }

  toggleOption(optionId: string): boolean {
    const task = this.getCurrentTask();
    if (!task || !task.options.some((option) => option.id === optionId)) {
      return false;
    }

    const selected = new Set(this.selections.get(task.id) ?? []);
    if (task.selectionMode === "single") {
      selected.clear();
      selected.add(optionId);
    } else if (selected.has(optionId)) {
      selected.delete(optionId);
    } else {
      if (task.maxSelections !== null && selected.size >= task.maxSelections) {
        return false;
      }
      selected.add(optionId);
    }
    this.selections.set(task.id, selected);
    return true;
  }

  canMoveNext(): boolean {
    const task = this.getCurrentTask();
    return Boolean(task && this.isTaskComplete(task) && this.taskIndex < this.tasks.length - 1);
  }

  moveNext(): boolean {
    if (!this.canMoveNext()) {
      return false;
    }
    this.taskIndex += 1;
    return true;
  }

  movePrevious(): boolean {
    if (this.taskIndex <= 0) {
      return false;
    }
    this.taskIndex -= 1;
    return true;
  }

  canSubmit(): boolean {
    return this.tasks.length > 0 && this.tasks.every((task) => this.isTaskComplete(task));
  }

  toResponse(): DailyChallengeResponse | null {
    if (!this.kind || !this.canSubmit()) {
      return null;
    }
    return {
      kind: this.kind,
      answers: this.tasks.map((task) => ({
        taskId: task.id,
        optionIds: this.getSelectedOptionIds(task.id),
      })),
    };
  }

  reset(): void {
    this.challengeId = null;
    this.kind = null;
    this.tasks = [];
    this.taskIndex = 0;
    this.selections.clear();
  }

  private isTaskComplete(task: VisibleDailyChallengeTask): boolean {
    const count = this.selections.get(task.id)?.size ?? 0;
    return count >= task.minSelections &&
      (task.maxSelections === null || count <= task.maxSelections);
  }
}
