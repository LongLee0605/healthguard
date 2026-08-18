import { FailFastGate, SingleFlight } from './concurrency';

describe('FailFastGate', () => {
  it('allows up to maxConcurrent and rejects the rest immediately', () => {
    const gate = new FailFastGate(1);
    expect(gate.tryEnter()).toBe(true);
    expect(gate.busy).toBe(true);
    expect(gate.tryEnter()).toBe(false);
    gate.leave();
    expect(gate.busy).toBe(false);
    expect(gate.tryEnter()).toBe(true);
  });
});

describe('SingleFlight', () => {
  it('shares one in-flight promise per key', async () => {
    const flight = new SingleFlight<number>();
    let runs = 0;
    const fn = async () => {
      runs += 1;
      await new Promise((r) => setTimeout(r, 20));
      return 42;
    };
    const [a, b, c] = await Promise.all([flight.do('k', fn), flight.do('k', fn), flight.do('k', fn)]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(c).toBe(42);
    expect(runs).toBe(1);
  });
});
