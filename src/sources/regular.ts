// 정기이벤트 — 수동 큐레이션(드론쇼·나이트마켓·플리마켓).
// data/regular-events.json 의 반복규칙을 여행기간 내 날짜로 전개한다. (공개 API 없음)

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { EventItem, Category } from "../types.ts";
import { dateRange, toYmd } from "../util.ts";

interface RegularDef {
  id: string; title: string; category: Category; place: string;
  lat: number | null; lng: number | null; outdoor: boolean;
  timeText?: string; link?: string | null;
  recurrence:
    | { type: "weekly"; weekday: number }   // 매주 특정 요일
    | { type: "daily" }                      // 매일(야시장 등)
    | { type: "dateList"; dates: string[] }; // 비정기 — 확정 날짜 목록
  season?: { start: string; end: string };
}

const DATA_URL = new URL("../../data/regular-events.json", import.meta.url);

export async function fetchRegular(
  tripStart: string, tripEnd: string,
): Promise<EventItem[]> {
  const defs: RegularDef[] = JSON.parse(
    await readFile(fileURLToPath(DATA_URL), "utf-8"),
  );
  const days = dateRange(tripStart, tripEnd);
  const out: EventItem[] = [];

  for (const def of defs) {
    for (const date of days) {
      if (def.season && !(toYmd(date) >= toYmd(def.season.start) &&
                          toYmd(date) <= toYmd(def.season.end))) continue;

      const r = def.recurrence;
      const hit = r.type === "daily" ? true
        : r.type === "weekly" ? new Date(date).getDay() === r.weekday
        : r.dates.includes(date);
      if (!hit) continue;

      out.push({
        id: `regular:${def.id}:${date}`,
        source: "regular",
        category: def.category,
        title: def.title,
        startDate: date, endDate: date,
        place: def.place + (def.timeText ? ` · ${def.timeText}` : ""),
        lat: def.lat, lng: def.lng,
        thumbnail: null,
        outdoor: def.outdoor,
        link: def.link ?? null,
      });
    }
  }
  return out;
}
