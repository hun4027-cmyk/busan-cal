// 물때 — 국립해양조사원 조석예보(고,저조). data.go.kr 1192136. (✅ 라이브 검증됨)
import { requireKey } from "../config.ts";
import { fetchText, toYmd } from "../util.ts";
import type { TideEvent } from "../types.ts";

export interface TideInfo { station: string; events: TideEvent[]; }

const BASE = "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService";
const BUSAN_OBS = "DT_0063"; // 가덕도(부산 강서구)

export async function fetchTide(date: string): Promise<TideInfo | null> {
  const key = requireKey();
  const qs = new URLSearchParams({
    serviceKey: key, pageNo: "1", numOfRows: "10", type: "json",
    obsCode: BUSAN_OBS, reqDate: toYmd(date),
  });
  const json: any = JSON.parse(await fetchText(`${BASE}?${qs}`));
  if (json?.header?.resultCode !== "00") return null;
  let items: any[] = json?.body?.items?.item ?? [];
  if (!Array.isArray(items)) items = items ? [items] : [];
  if (!items.length) return null;
  const events: TideEvent[] = items
    .map((it: any): TideEvent => ({
      time: String(it.predcDt ?? "").slice(11, 16),          // "HH:MM"
      type: Number(it.extrSe) % 2 === 1 ? "만조" : "간조",   // 홀수=만조, 짝수=간조
      levelCm: Number.isFinite(Number(it.predcTdlvVl)) ? Math.round(Number(it.predcTdlvVl)) : null,
    }))
    .filter((e: TideEvent) => e.time)
    .sort((a: TideEvent, b: TideEvent) => a.time.localeCompare(b.time));
  return { station: String(items[0].obsvtrNm ?? "부산"), events };
}
