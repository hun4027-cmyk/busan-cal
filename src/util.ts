// 날짜/HTTP 유틸 (외부 의존성 0)

/** "20260801" | "2026-08-01" → "2026-08-01" */
export function toDash(d: string): string {
  const s = d.replace(/-/g, "");
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
/** "2026-08-01" → "20260801" */
export function toYmd(d: string): string {
  return d.replace(/-/g, "");
}

/** 여행기간과 이벤트기간이 하루라도 겹치면 true (YYYYMMDD 비교) */
export function overlaps(
  evStart: string, evEnd: string, tripStart: string, tripEnd: string,
): boolean {
  if (!evStart) return false;
  const s = toYmd(evStart), e = toYmd(evEnd || evStart);
  const ts = toYmd(tripStart), te = toYmd(tripEnd);
  return s <= te && e >= ts;
}

/** [tripStart..tripEnd] 날짜 배열 (YYYY-MM-DD) */
export function dateRange(tripStart: string, tripEnd: string): string[] {
  const out: string[] = [];
  const d = new Date(toDash(tripStart));
  const end = new Date(toDash(tripEnd));
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** 두 날짜 사이 일수 차 (b - a) */
export function daysBetween(a: string, b: string): number {
  const ms = new Date(toDash(b)).getTime() - new Date(toDash(a)).getTime();
  return Math.round(ms / 86400000);
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "busan-cal/0.1" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url.split("?")[0]}`);
  return res.text();
}
export async function fetchJson<T = unknown>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}
