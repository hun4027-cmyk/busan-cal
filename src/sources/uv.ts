// 자외선 — 기상청 생활기상지수(3.0) getUVIdxV4. dataType=JSON. (✅ 라이브 검증됨)
import { requireKey } from "../config.ts";
import { fetchText } from "../util.ts";

export interface UvInfo { index: number | null; grade: string; }

const BASE = "https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4";
const BUSAN_AREA = "2600000000"; // 부산광역시 (✅ 검증됨)
const gradeOf = (v: number) => (v < 3 ? "낮음" : v <= 5 ? "보통" : v <= 7 ? "높음" : v <= 10 ? "매우높음" : "위험");

function kstBaseTime(): string {
  const k = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}${pad(k.getUTCMonth() + 1)}${pad(k.getUTCDate())}06`; // 오늘(KST) 06시 발표
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
  const vals: number[] = [];
  for (let h = 0; h <= 21; h += 3) {   // 오늘 낮 피크(정오=h6) 포함해 최고값 산출
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
export async function fetchUv(): Promise<UvInfo | null> { return parseUv(JSON.parse(await fetchText(uvUrl()))); }
