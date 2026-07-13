// 자외선 — 기상청 생활기상지수(3.0) getUVIdxV4. dataType=JSON.
import { requireKey } from "../config.ts";
import { fetchText } from "../util.ts";

export interface UvInfo { index: number | null; grade: string; }
const BASE = "https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4";
const BUSAN_AREA = "2600000000"; // 부산광역시 행정구역코드(검증 대상)
const gradeOf = (v: number) => (v < 3 ? "낮음" : v <= 5 ? "보통" : v <= 7 ? "높음" : v <= 10 ? "매우높음" : "위험");

function kstBaseTime(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = k.getUTCHours();
  const base = new Date(k);
  if (h >= 18) base.setUTCHours(18);
  else if (h >= 6) base.setUTCHours(6);
  else { base.setUTCDate(base.getUTCDate() - 1); base.setUTCHours(18); }
  return `${base.getUTCFullYear()}${pad(base.getUTCMonth() + 1)}${pad(base.getUTCDate())}${pad(base.getUTCHours())}`;
}
export function uvUrl(): string {
  const key = requireKey();
  const qs = new URLSearchParams({
    serviceKey: key, dataType: "JSON", numOfRows: "10", pageNo: "1",
    areaNo: BUSAN_AREA, time: kstBaseTime(),
  });
  return `${BASE}?${qs}`;
}
export function parseUv(json: any): UvInfo | null {
  const item = json?.response?.body?.items?.item?.[0] ?? json?.response?.body?.items?.[0];
  if (!item) return null;
  const keys = Object.keys(item).filter((k) => /^h\d+$/.test(k)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  for (const k of keys) { const n = Number(item[k]); if (Number.isFinite(n)) return { index: n, grade: gradeOf(n) }; }
  return null;
}
export async function fetchUv(): Promise<UvInfo | null> { return parseUv(JSON.parse(await fetchText(uvUrl()))); }
