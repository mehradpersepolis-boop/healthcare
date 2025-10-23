export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function backoffWithJitter(baseDelay, attempt) {
  const cap = 8000; // max 8s
  const exp = Math.min(cap, baseDelay * Math.pow(2, attempt - 1));
  return Math.floor(Math.random() * exp);
}
