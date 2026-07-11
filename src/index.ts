// CLI 데모 — 여행 날짜를 넣으면 날짜별 [날씨 + 이벤트]를 콘솔에 출력.
//   DATA_GO_KR_KEY=... node --experimental-strip-types src/index.ts 2026-08-01 2026-08-03

import { getTripPlan } from "./handler.ts";

function tag(outdoor: boolean) { return outdoor ? "🌤️야외" : "🏛️실내"; }

const [, , start = "2026-08-01", end = "2026-08-03"] = process.argv;

const plan = await getTripPlan(start, end);

for (const day of plan) {
  const w = day.weather;
  const wtxt = !w || !w.available
    ? "예보 준비 중"
    : `${w.sky ?? "-"} · 강수 ${w.pop ?? "-"}% · ${w.tempMin ?? "-"}~${w.tempMax ?? "-"}℃`;
  console.log(`\n📅 ${day.date}  [${wtxt}]`);
  if (day.events.length === 0) { console.log("   (이벤트 없음)"); continue; }
  for (const e of day.events) {
    const badge = e.badge ? `  — ${e.badge}` : "";
    console.log(`   ${tag(e.outdoor)} [${e.category}] ${e.title}  @${e.place}${badge}`);
  }
}
console.log("\n완료.");
