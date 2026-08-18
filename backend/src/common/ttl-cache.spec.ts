import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  it('returns stored value within TTL', () => {
    const cache = new TtlCache<string>(60_000);
    cache.set('a', 'hello');
    expect(cache.get('a')).toBe('hello');
  });

  it('expires values', () => {
    jest.useFakeTimers();
    const cache = new TtlCache<string>(1000);
    cache.set('a', 'hello');
    jest.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeUndefined();
    jest.useRealTimers();
  });
});
