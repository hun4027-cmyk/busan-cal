// 상수/설정 — 키는 환경변수로 주입 (코드에 하드코딩 금지)

export const CONFIG = {
  // data.go.kr 계정당 1개 공용키 (축제·전시·기상청 공통). 반드시 환경변수로.
  dataGoKrKey: process.env.DATA_GO_KR_KEY ?? "",

  busan: {
    areaCode: "6",     // TourAPI 부산
    sido: "부산",       // 문화정보원 클라이언트 필터값 (area === "부산")
    nx: 98, ny: 76,    // 기상청 단기예보 격자 (✅ 라이브 검증됨 — 부산 정상 응답)
    lat: 35.16, lng: 129.16,
  },

  cacheTtlMs: {
    events: 24 * 60 * 60 * 1000,  // 축제·전시: 하루
    weather: 3 * 60 * 60 * 1000,  // 날씨: 3시간
  },

  weatherHorizonDays: 10,          // 기상청 예보한계(단기+중기) — 초과분은 available=false
} as const;

export function requireKey(): string {
  if (!CONFIG.dataGoKrKey) {
    throw new Error("DATA_GO_KR_KEY 환경변수가 없습니다. export DATA_GO_KR_KEY=... 후 실행하세요.");
  }
  return CONFIG.dataGoKrKey;
}
