export class TtlCache<V> {
  private readonly store = new Map<string, { value: V; exp: number }>();

  constructor(private readonly ttlMs: number, private readonly max = 200) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.exp) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.max) {
      const first = this.store.keys().next().value;
      if (first !== undefined) this.store.delete(first);
    }
    this.store.set(key, { value, exp: Date.now() + this.ttlMs });
  }
}
