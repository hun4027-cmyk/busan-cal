// 축제 — 한국관광공사 TourAPI searchFestival2 (✅ 실호출 검증됨)
// 좌표: mapx=경도(lng), mapy=위도(lat). eventStartDate="그날에도 진행중"인 축제.

import { CONFIG, requireKey } from "../config.ts";
import type { EventItem } from "../types.ts";
import { fetchJson, overlaps, toDash } from "../util.ts";

const BASE = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";

interface RawFestival {
  contentid: string; title: string;
  eventstartdate: string; eventenddate: string;
  addr1?: string; mapx?: string; mapy?: string; firstimage?: string;
}

export async function fetchFestivals(
  tripStart: string, tripEnd: string,
): Promise<EventItem[]> {
  const qs = new URLSearchParams({
    MobileOS: "ETC", MobileApp: "busan-cal", _type: "json",
    arrange: "A", numOfRows: "300", pageNo: "1",
    eventStartDate: tripStart.replace(/-/g, ""),
    areaCode: CONFIG.busan.areaCode,
  });
  const url = `${BASE}?serviceKey=${requireKey()}&${qs}`;

  const data = await fetchJson<any>(url);
  let items = data?.response?.body?.items?.item ?? [];
  if (!Array.isArray(items)) items = items ? [items] : [];

  return (items as RawFestival[])
    .filter((x) => overlaps(x.eventstartdate, x.eventenddate, tripStart, tripEnd))
    .map((x): EventItem => ({
      id: `festival:${x.contentid}`,
      source: "festival",
      category: "축제",
      title: x.title,
      startDate: toDash(x.eventstartdate),
      endDate: toDash(x.eventenddate),
      place: x.addr1 ?? "",
      lat: x.mapy ? Number(x.mapy) : null,
      lng: x.mapx ? Number(x.mapx) : null,
      thumbnail: x.firstimage || null,
      outdoor: true,
      link: null,
    }));
}
