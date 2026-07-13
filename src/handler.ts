// 오케스트레이션 — 여행 날짜 → 날짜별 [날씨 + 이벤트 + (오늘)생활지수]
import type { DayPlan, EventItem, LifeInfo } from "./types.ts";
import { CONFIG } from "./config.ts";
import { cached } from "./cache.ts";
import { dateRange, toYmd } from "./util.ts";
import { fetchFestivals } from "./sources/festival.ts";
import { fetchCulture } from "./sources/culture.ts";
import { fetchRegular } from "./sources/regular.ts";
import { fetchBeaches } from "./sources/beach.ts";
import { fetchWeather } from "./sources/weather.ts";
import { fetchAir } from "./sources/air.ts";
import { fetchUv } from "./sources/uv.ts";
import { fetchTide } from "./sources/tide.ts";
import { swimBadge } from "./swim.ts";

function activeOn(ev: EventItem, date: string): boolean {
  const d = toYmd(date);
  return toYmd(ev.startDate) <= d && toYmd(ev.endDate) >= d;
}
const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

export async function getTripPlan(tripStart: string, tripEnd: string): Promise<DayPlan[]> {
  const k = `${tripStart}_${tripEnd}`;
  const { events: evTtl, weather: wTtl } = CONFIG.cacheTtlMs;

  const [festivals, culture, regular, beaches, weather] = await Promise.all([
    cached(`festival:${k}`, evTtl, () => fetchFestivals(tripStart, tripEnd)).catch(warn("festival")),
    cached(`culture:${k}`, evTtl, () => fetchCulture(tripStart, tripEnd)).catch(warn("culture")),
    cached(`regular:${k}`, evTtl, () => fetchRegular(tripStart, tripEnd)).catch(warn("regular")),
    cached(`beach:${k}`, evTtl, () => fetchBeaches(tripStart, tripEnd)).catch(warn("beach")),
    cached(`weather:${k}`, wTtl, () => fetchWeather(tripStart, tripEnd)).catch(warnW),
  ]);

  const all: EventItem[] = [...festivals, ...culture, ...regular, ...beaches];
  const days = dateRange(tripStart, tripEnd);

  // 생활지수: 오늘이 범위에 있을 때만, 오늘 항목에 부착 (미세먼지·자외선=현재값, 물때=오늘)
  const today = kstToday();
  let life: LifeInfo | null = null;
  if (days.includes(today)) {
    const [air, uv, tide] = await Promise.all([
      cached("air:busan", wTtl, () => fetchAir()).catch(() => null),
      cached("uv:busan", wTtl, () => fetchUv()).catch(() => null),
      cached(`tide:${today}`, wTtl, () => fetchTide(today)).catch(() => null),
    ]);
    if (air || uv || tide) {
      life = {
        pm10: air?.pm10 ?? null, pm25: air?.pm25 ?? null, airGrade: air?.gradeText ?? null,
        uvIndex: uv?.index ?? null, uvGrade: uv?.grade ?? null,
        tideStation: tide?.station ?? null, tides: tide?.events ?? [],
      };
    }
  }

  return days.map((date): DayPlan => {
    const dayWeather = weather[date] ?? null;
    const seenIds = new Set<string>();
    const events = all
      .filter((ev) => activeOn(ev, date))
      .filter((ev) => (seenIds.has(ev.id) ? false : (seenIds.add(ev.id), true)))
      .map((ev): EventItem =>
        ev.source === "beach"
          ? { ...ev, startDate: date, endDate: date, badge: swimBadge(dayWeather) }
          : ev)
      .sort((a, b) => Number(b.outdoor) - Number(a.outdoor));
    return { date, weather: dayWeather, events, life: date === today ? life : null };
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
