import { gzipSync } from 'zlib';

/** Gzip JSON responses > 800 bytes without an extra npm package. */
export function gzipJsonMiddleware() {
  return (req: { method?: string; headers: Record<string, unknown> }, res: {
    json: (body: unknown) => unknown;
    setHeader: (k: string, v: string) => void;
    end: (buf: Buffer) => void;
  }, next: () => void) => {
    const accept = String(req.headers['accept-encoding'] ?? '');
    if (req.method === 'HEAD' || !accept.includes('gzip')) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      try {
        const raw = Buffer.from(JSON.stringify(body), 'utf8');
        if (raw.length < 800) return originalJson(body);
        const compressed = gzipSync(raw, { level: 3 });
        if (compressed.length >= raw.length - 64) return originalJson(body);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Length', String(compressed.length));
        res.setHeader('Vary', 'Accept-Encoding');
        res.end(compressed);
        return res;
      } catch {
        return originalJson(body);
      }
    };
    next();
  };
}
