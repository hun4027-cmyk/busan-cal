// 기상청 중기예보(4~10일) — 육상(getMidLandFcst) + 기온(getMidTa) 조합.
// ✅ 라이브 검증됨: regId 육상=11H20000·기온=11H20201, 필드 4일차 시작, 날짜=발표일+N.
//    (4~7일차 Am/Pm, 8~10일차 단일 / 단기 오늘~+3일과 이어져 빈틈 없음)

import { requireKey } from "../config.ts";
import type { DayWeather } from "../types.ts";
import { fetchJson } from "../util.ts";

const LAND = "https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst";
const TA = "https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa";

// ⚠️ regId 라이브 확인 필요: 육상=부산·울산·경남권, 기온=부산 도시코드
const REG_LAND = "11H20000";
const REG_TA = "11H20201";

const ymdhm = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/** 중기 발표시각(06/18시). 이른 시간이면 어제 1800로 폴백. tmFc="YYYYMMDD0600|1800" */
function latestTmFc(now: Date): { tmFc: string; baseDate: string } {
  const h = now.getHours();
  if (h >= 18) return { tmFc: ymdhm(now) + "1800", baseDate: ymdhm(now) };
  if (h >= 6) return { tmFc: ymdhm(now) + "0600", baseDate: ymdhm(now) };
  const y = new Date(now); y.setDate(y.getDate() - 1);
  return { tmFc: ymdhm(y) + "1800", baseDate: ymdhm(y) };
}

async function firstItem(url: string): Promise<Record<string, string> | null> {
  const data = await fetchJson<any>(url);
  const item = data?.response?.body?.items?.item;
  const one = Array.isArray(item) ? item[0] : item;
  return one ?? null;
}

function pick(rec: Record<string, string>, ...keys: string[]): string | undefined {
  for (const k of keys) if (rec[k] != null && rec[k] !== "") return rec[k];
  return undefined;
}

/** 여러 후보값 중 최댓값(숫자). 강수확률 오전·오후 중 높은 쪽 채택용. */
function maxNum(rec: Record<string, string>, ...keys: string[]): number | undefined {
  const nums = keys.map((k) => rec[k]).filter((v) => v != null && v !== "").map(Number)
    .filter((n) => !Number.isNaN(n));
  return nums.length ? Math.max(...nums) : undefined;
}

function precipOf(wf: string): string {
  if (/소나기/.test(wf)) return "소나기";
  if (/눈/.test(wf)) return "눈";
  if (/비/.test(wf)) return "비";
  return "없음";
}

/** tmFc 발표일 기준 N일 후 → YYYY-MM-DD */
function dateOfN(baseDate: string, n: number): string {
  const d = new Date(`${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function fetchMid(now: Date): Promise<Record<string, DayWeather>> {
  const key = requireKey();
  const { tmFc, baseDate } = latestTmFc(now);
  const q = (base: string, regId: string) =>
    `${base}?serviceKey=${key}&${new URLSearchParams(
      { dataType: "JSON", numOfRows: "10", pageNo: "1", regId, tmFc })}`;

  const [land, ta] = await Promise.all([
    firstItem(q(LAND, REG_LAND)),
    firstItem(q(TA, REG_TA)),
  ]);

  const out: Record<string, DayWeather> = {};
  // 중기 유효범위 3~10일(관대하게 3부터 시도, 없으면 skip)
  for (let n = 3; n <= 10; n++) {
    // 육상예보 실검증: 4~7일차 Am/Pm, 8~10일차 단일. wf=오후 대표, 강수확률=오전·오후 최댓값.
    const wf = land ? pick(land, `wf${n}Pm`, `wf${n}Am`, `wf${n}`) : undefined;
    const pop = land ? maxNum(land, `rnSt${n}Am`, `rnSt${n}Pm`, `rnSt${n}`) : undefined;
    const tMax = ta ? pick(ta, `taMax${n}`) : undefined;
    const tMin = ta ? pick(ta, `taMin${n}`) : undefined;
    if (wf === undefined && tMax === undefined) continue; // 그 날짜 데이터 없음

    const date = dateOfN(baseDate, n);
    out[date] = {
      date,
      sky: wf ?? null,
      precipType: wf ? precipOf(wf) : null,
      pop: pop !== undefined ? Number(pop) : null,
      tempMax: tMax !== undefined ? Number(tMax) : null,
      tempMin: tMin !== undefined ? Number(tMin) : null,
      waveM: null,              // 중기예보엔 파고 없음(단기에서만 제공)
      available: true,
    };
  }
  return out;
}
