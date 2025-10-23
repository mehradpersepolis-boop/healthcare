import { API_KEY } from "./config.js";
import { sleep, backoffWithJitter } from "./backoff.js";

export async function fetchWithRetry(
  url,
  options = {},
  { attempts = 6, baseDelay = 400 } = {}
) {
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          "x-api-key": API_KEY,
          accept: "application/json",
        },
      });

      if (res.status === 429 || res.status === 500 || res.status === 503) {
        if (attempt >= attempts) {
          throw new Error(`HTTP ${res.status} after ${attempt} attempts`);
        }

        const retryAfter = res.headers.get("retry-after");
        const delayMs = retryAfter
          ? Math.max(0, Number(retryAfter) * 1000)
          : backoffWithJitter(baseDelay, attempt);
        await sleep(delayMs);
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const bodyText = await res.text();
      try {
        return JSON.parse(bodyText);
      } catch {
        const forgiving = bodyText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (forgiving) return JSON.parse(forgiving[0]);
        throw new Error("Unable to parse response JSON");
      }
    } catch (err) {
      if (attempt >= attempts) throw err;
      await sleep(backoffWithJitter(baseDelay, attempt));
    }
  }
}
