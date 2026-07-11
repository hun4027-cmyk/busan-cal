// 날씨 오케스트레이터 — 단기(0~3일) + 중기(3~10일) 병합.
//   · 단기 우선(더 정확·상세), 없는 날은 중기로 보충, 예보범위(~10일) 밖은 available=false.
//   · 소스별 에러 격리(중기 실패해도 단기는 살림).

import { CONFIG } from "../config.ts";
import type { DayWeather } from "../types.ts";
import { dateRange, daysBetween } from "../util.ts";
import { fetchShort } from "./weather-short.ts";
import { fetchMid } from "./weather-mid.ts";

function empty(date: string): DayWeather {
  return { date, sky: null, precipType: null, pop: null,
    tempMin: null, tempMax: null, waveM: null, available: false };
}

export async function fetchWeather(
  tripStart: string, tripEnd: string, now = new Date(),
): Promise<Record<string, DayWeather>> {
  const dates = dateRange(tripStart, tripEnd);
  const today = now.toISOString().slice(0, 10);
  const result: Record<string, DayWeather> = {};
  for (const d of dates) result[d] = empty(d);

  // 여행기간이 통째로 예보범위(오늘~+10일) 밖이면 호출 없이 반환
  const inHorizon = dates.some((d) => {
    const g = daysBetween(today, d);
    return g >= 0 && g <= CONFIG.weatherHorizonDays;
  });
  if (!inHorizon) return result;

  const [short, mid] = await Promise.all([
    fetchShort(now).catch(warn("short")),
    fetchMid(now).catch(warn("mid")),
  ]);

  for (const d of dates) {
    if (short[d]) result[d] = short[d];        // 단기 우선
    else if (mid[d]) result[d] = mid[d];        // 중기 보충
  }
  return result;
}

const warn = (name: string) => (e: unknown) => {
  console.warn(`⚠️ [weather-${name}] 실패 → 건너뜀:`, (e as Error).message);
  return {} as Record<string, DayWeather>;
};
