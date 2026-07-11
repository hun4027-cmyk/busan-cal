// 오케스트레이션 — 여행 날짜 → 날짜별 [날씨 + 이벤트]
// 소스별 캐시로 감싼다(비용을 사용자 수와 분리). 미니앱은 이 함수 결과만 받는다.

import type { DayPlan, EventItem } from "./types.ts";
import { CONFIG } from "./config.ts";
import { cached } from "./cache.ts";
import { dateRange, toYmd } from "./util.ts";
import { fetchFestivals } from "./sources/festival.ts";
import { fetchCulture } from "./sources/culture.ts";
import { fetchRegular } from "./sources/regular.ts";
import { fetchBeaches } from "./sources/beach.ts";
import { fetchWeather } from "./sources/weather.ts";
import { swimBadge } from "./swim.ts";

/** 이벤트가 특정 날짜에 '진행 중'인가 */
function activeOn(ev: EventItem, date: string): boolean {
  const d = toYmd(date);
  return toYmd(ev.startDate) <= d && toYmd(ev.endDate) >= d;
}

export async function getTripPlan(
  tripStart: string, tripEnd: string,
): Promise<DayPlan[]> {
  const k = `${tripStart}_${tripEnd}`;
  const { events: evTtl, weather: wTtl } = CONFIG.cacheTtlMs;

  // 소스별 병렬 + 캐시. 한 소스가 실패해도 나머지는 살린다.
  const [festivals, culture, regular, beaches, weather] = await Promise.all([
    cached(`festival:${k}`, evTtl, () => fetchFestivals(tripStart, tripEnd)).catch(warn("festival")),
    cached(`culture:${k}`, evTtl, () => fetchCulture(tripStart, tripEnd)).catch(warn("culture")),
    cached(`regular:${k}`, evTtl, () => fetchRegular(tripStart, tripEnd)).catch(warn("regular")),
    cached(`beach:${k}`, evTtl, () => fetchBeaches(tripStart, tripEnd)).catch(warn("beach")),
    cached(`weather:${k}`, wTtl, () => fetchWeather(tripStart, tripEnd)).catch(warnW),
  ]);

  const all: EventItem[] = [...festivals, ...culture, ...regular, ...beaches];

  return dateRange(tripStart, tripEnd).map((date): DayPlan => {
    const dayWeather = weather[date] ?? null;
    const events = all
      .filter((ev) => activeOn(ev, date))
      // 해수욕장은 그날 날씨로 물놀이 배지를 계산해 날짜별 항목으로 복제
      .map((ev): EventItem =>
        ev.source === "beach"
          ? { ...ev, startDate: date, endDate: date, badge: swimBadge(dayWeather) }
          : ev)
      .sort((a, b) => Number(b.outdoor) - Number(a.outdoor)); // 야외 우선(정렬규칙 TODO)
    return { date, weather: dayWeather, events };
  });
}

const warn = (name: string) => (e: unknown) => {
  console.warn(`⚠️ [${name}] 소스 실패 → 건너뜀:`, (e as Error).message);
  return [] as EventItem[];
};
const warnW = (e: unknown) => {
  console.warn(`⚠️ [weather] 소스 실패 → 건너뜀:`, (e as Error).message);
  return {} as Record<string, import("./types.ts").DayWeather>;
};
