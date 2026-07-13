// 자외선 — 기상청 생활기상지수(3.0) getUVIdxV4. 가장 최근 발표를 자동 탐색. (✅ 라이브 검증됨)
import { requireKey } from "../config.ts";
import { fetchText } from "../util.ts";

export interface UvInfo { index: number | null; grade: string; }

const BASE = "https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4";
const BUSAN_AREA = "2600000000"; // 부산광역시 (✅ 검증됨)
const pad = (n: number) => String(n).padStart(2, "0");
const gradeOf = (v: number) => (v < 3 ? "낮음" : v <= 5 ? "보통" : v <= 7 ? "높음" : v <= 10 ? "매우높음" : "위험");

// 최근 발표 후보(최신순): 오늘18 · 오늘06 · 어제18 · 어제06 → 존재하는 첫 값 사용
function candidateTimes(): string[] {
  const k = new Date(Date.now() + 9 * 3600 * 1000);
  const y = new Date(k); y.setUTCDate(y.getUTCDate() - 1);
  const fmt = (d: Date, h: number) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(h)}`;
  return [fmt(k, 18), fmt(k, 6), fmt(y, 18), fmt(y, 6)];
}
function uvUrl(time: string): string {
  const key = requireKey();
  const qs = new URLSearchParams({
    serviceKey: key, dataType: "JSON", numOfRows: "10", pageNo: "1",
    areaNo: BUSAN_AREA, time,
  });
  return `${BASE}?${qs}`;
}
export function parseUv(json: any): UvInfo | null {
  const item = json?.response?.body?.items?.item?.[0] ?? json?.response?.body?.items?.[0];
  if (!item) return null;
  const vals: number[] = [];
  for (let h = 0; h <= 21; h += 3) {   // 오늘 낮 피크(정오=h6) 포함해 최고값
    const raw = item[`h${h}`];
    if (raw != null && String(raw).trim() !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) vals.push(n);
    }
  }
  if (!vals.length) return null;
  const idx = Math.max(...vals);
  return { index: idx, grade: gradeOf(idx) };
}
export async function fetchUv(): Promise<UvInfo | null> {
  for (const t of candidateTimes()) {
    try {
      const uv = parseUv(JSON.parse(await fetchText(uvUrl(t))));
      if (uv) return uv;
    } catch { /* 다음 후보 */ }
  }
  return null;
}
