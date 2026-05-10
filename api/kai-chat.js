// api/kai-chat.js — Vercel serverless function.
//
// Proxies KAI chat requests to Groq using a SERVER-SIDE API key.
// The key lives in the Vercel project's env vars (GROQ_API_KEY) and
// never appears in the browser bundle, in network responses, or in
// git history.
//
// Per-IP rate limiting prevents the public endpoint from being abused
// to drive someone else's Groq bill. In-memory bucket is fine for a
// single Vercel function instance; for higher traffic, swap to Vercel
// KV or Upstash.

const RATE_LIMIT_PER_HOUR = 30;
const _ipBuckets = new Map();

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
];

function rateLimit(ip) {
  const now = Date.now();
  const bucket = _ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    _ipBuckets.set(ip, { count: 1, resetAt: now + 3600_000 });
    return { ok: true, remaining: RATE_LIMIT_PER_HOUR - 1 };
  }
  if (bucket.count >= RATE_LIMIT_PER_HOUR) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count++;
  return { ok: true, remaining: RATE_LIMIT_PER_HOUR - bucket.count };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const limit = rateLimit(ip);
  if (!limit.ok) {
    res.setHeader('Retry-After', limit.retryAfter);
    return res
      .status(429)
      .json({ error: `rate limit reached. retry in ${limit.retryAfter}s.` });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res
      .status(500)
      .json({ error: 'KAI not configured (missing GROQ_API_KEY env var)' });
  }

  const { messages, max_tokens = 500, temperature = 0.78 } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Reject obviously over-sized payloads before forwarding.
  const totalChars = JSON.stringify(messages).length;
  if (totalChars > 60_000) {
    return res.status(413).json({ error: 'conversation too large' });
  }

  for (const model of MODELS) {
    try {
      const groq = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            max_tokens,
            temperature,
            messages,
          }),
        }
      );

      if (groq.ok) {
        const data = await groq.json();
        res.setHeader('X-RateLimit-Remaining', String(limit.remaining));
        res.setHeader('X-Model-Used', model);
        return res.status(200).json(data);
      }

      if (groq.status === 429) continue; // try next model
      const err = await groq.json().catch(() => ({}));
      return res
        .status(groq.status)
        .json({ error: err?.error?.message || `groq ${groq.status}` });
    } catch (_modelErr) {
      // network / parse error — fall through to next model
      continue;
    }
  }

  return res.status(503).json({
    error: 'all upstream models exhausted, please try again shortly',
  });
}
