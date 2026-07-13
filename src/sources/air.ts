// 미세먼지 — 한국환경공단 에어코리아 대기오염정보 (시도별 실시간). returnType=json.
import { CONFIG, requireKey } from "../config.ts";
import { fetchText } from "../util.ts";

export interface AirInfo {
  pm10: number | null; pm25: number | null;
  pm10Grade: number | null; pm25Grade: number | null;
  gradeText: string; dataTime: string | null;
}

const BASE = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty";
const GRADE_TEXT = ["-", "좋음", "보통", "나쁨", "매우나쁨"];
const pm10GradeOf = (v: number) => (v <= 30 ? 1 : v <= 80 ? 2 : v <= 150 ? 3 : 4);
const pm25GradeOf = (v: number) => (v <= 15 ? 1 : v <= 35 ? 2 : v <= 75 ? 3 : 4);

export function airUrl(): string {
  const key = requireKey();
  const qs = new URLSearchParams({
    serviceKey: key, returnType: "json", numOfRows: "100", pageNo: "1",
    sidoName: CONFIG.busan.sido, ver: "1.0",
  });
  return `${BASE}?${qs}`;
}
export function parseAir(json: any): AirInfo | null {
  const items: any[] = json?.response?.body?.items ?? [];
  const num = (s: any) => { const n = Number(s); return Number.isFinite(n) ? n : null; };
  const pm10s = items.map((i) => num(i.pm10Value)).filter((n): n is number => n != null && n >= 0);
  const pm25s = items.map((i) => num(i.pm25Value)).filter((n): n is number => n != null && n >= 0);
  if (!pm10s.length && !pm25s.length) return null;
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  const pm10 = avg(pm10s), pm25 = avg(pm25s);
  const pm10Grade = pm10 != null ? pm10GradeOf(pm10) : null;
  const pm25Grade = pm25 != null ? pm25GradeOf(pm25) : null;
  const worst = Math.max(pm10Grade ?? 0, pm25Grade ?? 0);
  return { pm10, pm25, pm10Grade, pm25Grade, gradeText: GRADE_TEXT[worst] ?? "-", dataTime: items.find((i) => i.dataTime)?.dataTime ?? null };
}
export async function fetchAir(): Promise<AirInfo | null> { return parseAir(JSON.parse(await fetchText(airUrl()))); }
