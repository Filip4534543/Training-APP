export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

export function dotsBetween(from: number, to: number): number[] {
  const ax = from % 3;
  const ay = Math.floor(from / 3);
  const bx = to % 3;
  const by = Math.floor(to / 3);
  const dx = bx - ax;
  const dy = by - ay;
  const steps = gcd(dx, dy);
  if (steps <= 1) return [];
  const extra: number[] = [];
  for (let i = 1; i < steps; i += 1) {
    extra.push(ax + (dx / steps) * i + (ay + (dy / steps) * i) * 3);
  }
  return extra;
}

export function appendPatternDot(path: number[], next: number): number[] {
  if (next < 0 || next > 8 || path.includes(next)) return path;
  if (path.length === 0) return [next];
  const last = path[path.length - 1]!;
  const skipped = dotsBetween(last, next).filter((dot) => !path.includes(dot));
  return [...path, ...skipped, next];
}

export function patternKey(path: number[]) {
  return path.join("-");
}

export async function hashPattern(path: number[]): Promise<string> {
  const data = new TextEncoder().encode(patternKey(path));
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const MIN_PATTERN_LENGTH = 4;

export const UNLOCK_STORAGE_KEY = "training-app-unlocked-profile";
