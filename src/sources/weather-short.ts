// 기상청 단기예보(0~3일) — 격자 nx/ny 기준. ✅ 라이브 검증됨(부산 nx=98,ny=76).
// 반환: 커버되는 날짜만 date→DayWeather (available=true).

import { CONFIG, requireKey } from "../config.ts";
import type { DayWeather } from "../types.ts";
import { fetchJson, toDash } from "../util.ts";

const BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const SLOTS = ["2300", "2000", "1700", "1400", "1100", "0800", "0500", "0200"];
const SKY: Record<string, string> = { "1": "맑음", "3": "구름많음", "4": "흐림" };
const PTY: Record<string, string> = { "0": "없음", "1": "비", "2": "비/눈", "3": "눈", "4": "소나기" };

const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/** 지금 기준 가장 최근 발표. 이른 새벽이면 어제 2300로 폴백. */
function latestBase(now: Date): { base_date: string; base_time: string } {
  const hhmm = now.getHours() * 100 + now.getMinutes();
  for (const s of SLOTS) if (hhmm >= Number(s) + 10) return { base_date: ymd(now), base_time: s };
  const y = new Date(now); y.setDate(y.getDate() - 1);
  return { base_date: ymd(y), base_time: "2300" };
}

interface RawFcst { category: string; fcstDate: string; fcstValue: string; }

export async function fetchShort(now: Date): Promise<Record<string, DayWeather>> {
  const { base_date, base_time } = latestBase(now);
  const qs = new URLSearchParams({
    dataType: "JSON", numOfRows: "1000", pageNo: "1",
    base_date, base_time,
    nx: String(CONFIG.busan.nx), ny: String(CONFIG.busan.ny),
  });
  const data = await fetchJson<any>(`${BASE}?serviceKey=${requireKey()}&${qs}`);
  const items: RawFcst[] = data?.response?.body?.items?.item ?? [];

  const out: Record<string, DayWeather> = {};
  const day = (d: string) =>
    (out[d] ??= { date: d, sky: null, precipType: null, pop: null,
      tempMin: null, tempMax: null, waveM: null, available: true });

  for (const it of items) {
    const w = day(toDash(it.fcstDate));
    switch (it.category) {
      case "SKY": w.sky = SKY[it.fcstValue] ?? w.sky; break;
      case "PTY": w.precipType = PTY[it.fcstValue] ?? w.precipType; break;
      case "POP": w.pop = Math.max(w.pop ?? 0, Number(it.fcstValue)); break;
      case "TMX": w.tempMax = Number(it.fcstValue); break;
      case "TMN": w.tempMin = Number(it.fcstValue); break;
      case "TMP": if (w.tempMax === null) w.tempMax = Number(it.fcstValue); break;
      case "WAV": { // 파고(m) — 일 최대값 채택
        const v = Number(it.fcstValue);
        if (!Number.isNaN(v)) w.waveM = Math.max(w.waveM ?? 0, v);
        break;
      }
    }
  }
  return out;
}
