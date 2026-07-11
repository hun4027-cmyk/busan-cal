// 물놀이 지수 — 그날 날씨(기상청)로 해수욕장 적합도 배지를 만든다.
//   입력: 강수확률(POP) · 기온(TMX) · 파고(WAV). (수온은 MVP 미포함 — Open-Meteo 해양으로 확장 가능)
//   출력: "🏖️ 물놀이 좋음 · 28℃ · 파고 0.5m" 같은 짧은 배지. 데이터 없으면 null.

import type { DayWeather } from "./types.ts";

export function swimBadge(w: DayWeather | null): string | null {
  if (!w || !w.available) return null;

  const rainy = (w.pop ?? 0) >= 60 || (w.precipType != null && w.precipType !== "없음");
  const bigWave = w.waveM != null && w.waveM >= 2;
  const cold = w.tempMax != null && w.tempMax < 22;
  const mild = (w.pop ?? 0) >= 30 || (w.tempMax != null && w.tempMax < 26);

  const level = rainy || bigWave || cold ? "주의"
    : mild ? "보통"
    : "좋음";
  const icon = level === "좋음" ? "🏖️" : level === "보통" ? "🌊" : "⚠️";

  const parts = [`${icon} 물놀이 ${level}`];
  if (w.tempMax != null) parts.push(`${w.tempMax}℃`);
  if ((w.pop ?? 0) >= 30) parts.push(`강수 ${w.pop}%`);
  if (w.waveM != null) parts.push(`파고 ${w.waveM}m`);
  return parts.join(" · ");
}
