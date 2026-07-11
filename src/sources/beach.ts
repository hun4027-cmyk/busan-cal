// 해수욕장 — 부산 주요 해수욕장(정적 목록). "시즌 내내 갈 수 있는 곳".
//   개장기간 동안 매일 노출되고, 물놀이 지수(배지)는 handler에서 그날 날씨로 계산한다.
//   ⚠️ 개장기간(SEASON)은 매년 공지로 확정 필요(현재는 통상 여름 기준 임시값).

import type { EventItem } from "../types.ts";
import { overlaps } from "../util.ts";

const SEASON = { start: "2026-06-01", end: "2026-08-31" }; // TODO: 연도별 공식 개장기간

interface BeachDef { id: string; name: string; lat: number; lng: number; }

const BEACHES: BeachDef[] = [
  { id: "haeundae", name: "해운대 해수욕장", lat: 35.1587, lng: 129.1604 },
  { id: "gwangalli", name: "광안리 해수욕장", lat: 35.1532, lng: 129.1187 },
  { id: "songjeong", name: "송정 해수욕장", lat: 35.1786, lng: 129.1996 },
  { id: "dadaepo", name: "다대포 해수욕장", lat: 35.0480, lng: 128.9660 },
  { id: "songdo", name: "송도 해수욕장", lat: 35.0759, lng: 129.0166 },
  { id: "ilgwang", name: "일광 해수욕장", lat: 35.2620, lng: 129.2360 },
  { id: "imnang", name: "임랑 해수욕장", lat: 35.3266, lng: 129.2660 },
];

/** 여행기간이 개장시즌과 겹치면 해수욕장들을 이벤트로 반환(기간=시즌 전체). */
export async function fetchBeaches(
  tripStart: string, tripEnd: string,
): Promise<EventItem[]> {
  if (!overlaps(SEASON.start, SEASON.end, tripStart, tripEnd)) return [];
  return BEACHES.map((b): EventItem => ({
    id: `beach:${b.id}`,
    source: "beach",
    category: "바다",
    title: b.name,
    startDate: SEASON.start,
    endDate: SEASON.end,
    place: b.name,
    lat: b.lat, lng: b.lng,
    thumbnail: null,
    outdoor: true,
    link: null,
    badge: null, // handler에서 그날 날씨로 채움
  }));
}
