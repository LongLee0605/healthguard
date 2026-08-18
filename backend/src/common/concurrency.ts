/** Non-blocking concurrency gate — extra callers fail immediately instead of queueing. */
export class FailFastGate {
  private active = 0;

  constructor(private readonly maxConcurrent: number) {}

  get busy(): boolean {
    return this.active >= this.maxConcurrent;
  }

  get activeCount(): number {
    return this.active;
  }

  tryEnter(): boolean {
    if (this.active >= this.maxConcurrent) return false;
    this.active += 1;
    return true;
  }

  leave(): void {
    this.active = Math.max(0, this.active - 1);
  }
}

/** Collapse concurrent work for the same key into one in-flight promise. */
export class SingleFlight<T> {
  private readonly inflight = new Map<string, Promise<T>>();

  do(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing;
    const pending = fn().finally(() => this.inflight.delete(key));
    this.inflight.set(key, pending);
    return pending;
  }
}
