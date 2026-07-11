// 전시·공연·행사 — 한국문화정보원 한눈에보는문화정보 period2 (✅ 실호출 검증됨)
// 특징: XML 응답 / period2는 지역필터 없음(전국) → 클라이언트에서 area==="부산" 필터.
//       gpsX=경도(lng), gpsY=위도(lat). serviceName=전시/공연/행사·축제.

import { CONFIG, requireKey } from "../config.ts";
import type { EventItem, Category } from "../types.ts";
import { fetchText, overlaps, toDash } from "../util.ts";

const BASE = "https://apis.data.go.kr/B553457/cultureinfo/period2";

// 실내로 볼 카테고리 (그 외는 야외)
const INDOOR = new Set(["전시", "공연"]);

function categoryOf(serviceName: string): Category {
  if (serviceName.includes("전시")) return "전시";
  if (serviceName.includes("공연")) return "공연";
  return "행사";
}

/** 스켈레톤용 경량 XML 파서 — cultureinfo는 <item> 아래가 평면 구조라 이걸로 충분.
 *  (운영 전환 시 fast-xml-parser 등으로 교체 권장) */
function parseItems(xml: string): Record<string, string>[] {
  const items: Record<string, string>[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const rec: Record<string, string> = {};
    for (const t of block.matchAll(/<([a-zA-Z]+)>([\s\S]*?)<\/\1>/g)) {
      rec[t[1]] = t[2].trim();
    }
    items.push(rec);
  }
  return items;
}

export async function fetchCulture(
  tripStart: string, tripEnd: string,
): Promise<EventItem[]> {
  const key = requireKey();
  const collected: Record<string, string>[] = [];
  const seen = new Set<string>();   // seq 중복제거

  for (let page = 1; page <= 10; page++) {
    const qs = new URLSearchParams({
      serviceKey: key,
      from: tripStart.replace(/-/g, ""),
      to: tripEnd.replace(/-/g, ""),
      numOfRows: "100", pageNo: String(page),
    });
    const xml = await fetchText(`${BASE}?${qs}`);
    const total = Number(/<totalCount>(\d+)<\/totalCount>/.exec(xml)?.[1] ?? 0);
    const items = parseItems(xml);

    let added = 0;
    for (const it of items) {
      const seq = it.seq ?? "";
      if (seq && !seen.has(seq)) { seen.add(seq); collected.push(it); added++; }
    }
    // 응답이 비었거나, pageNo가 무시돼 새 항목이 없거나, 다 모았으면 중단(중복 방지)
    if (items.length === 0 || added === 0 || collected.length >= total) break;
  }

  return collected
    .filter((x) => x.area === CONFIG.busan.sido)          // 부산 필터
    .filter((x) => overlaps(x.startDate, x.endDate, tripStart, tripEnd))
    .map((x): EventItem => {
      const cat = categoryOf(x.serviceName ?? "");
      return {
        id: `culture:${x.seq}`,
        source: "culture",
        category: cat,
        title: x.title ?? "",
        startDate: toDash(x.startDate ?? ""),
        endDate: toDash(x.endDate ?? ""),
        place: x.place ?? "",
        lat: x.gpsY ? Number(x.gpsY) : null,
        lng: x.gpsX ? Number(x.gpsX) : null,
        thumbnail: x.thumbnail || null,
        outdoor: !INDOOR.has(cat),
        link: null,
      };
    });
}
