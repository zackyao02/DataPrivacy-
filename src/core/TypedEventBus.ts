type Listener<Payload> = (payload: Payload) => void;
type AnyListener = Listener<unknown>;

export class TypedEventBus<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<AnyListener>>();

  on<EventName extends keyof Events>(
    eventName: EventName,
    listener: Listener<Events[EventName]>,
  ): () => void {
    const eventListeners =
      this.listeners.get(eventName) ?? new Set<AnyListener>();

    eventListeners.add(listener as AnyListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(listener as AnyListener);

      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  emit<EventName extends keyof Events>(
    eventName: EventName,
    payload: Events[EventName],
  ): void {
    this.listeners
      .get(eventName)
      ?.forEach((listener) => listener(payload as unknown));
  }

  clear(): void {
    this.listeners.clear();
  }
}

