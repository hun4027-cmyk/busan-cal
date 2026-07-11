// 통합 도메인 타입 — 3소스를 이 형태로 정규화한다.

export type SourceKind = "festival" | "culture" | "regular" | "beach";
export type Category =
  | "축제" | "행사" | "전시" | "공연" | "바다" | "드론쇼" | "마켓";

/** 캘린더에 얹히는 단일 이벤트(정규화 결과) */
export interface EventItem {
  id: string;                 // "festival:3576410" 처럼 소스+원본ID
  source: SourceKind;
  category: Category;
  title: string;
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  place: string;
  lat: number | null;         // 위도
  lng: number | null;         // 경도
  thumbnail: string | null;
  outdoor: boolean;           // 🌤️야외 / 🏛️실내
  link: string | null;
  badge?: string | null;      // 날씨 기반 배지(예: 해수욕장 물놀이 지수). 없으면 미표시
}

/** 하루치 날씨 (기상청 정규화 결과) */
export interface DayWeather {
  date: string;               // YYYY-MM-DD
  sky: string | null;         // 맑음 / 구름많음 / 흐림
  precipType: string | null;  // 없음 / 비 / 비눈 / 눈 / 소나기
  pop: number | null;         // 강수확률 %
  tempMin: number | null;
  tempMax: number | null;
  waveM: number | null;       // 파고(m) — 기상청 단기 WAV. 해수욕장 물놀이 지수에 사용
  available: boolean;         // 예보범위(~10일) 밖이면 false → "예보 준비 중"
}

/** 최종 응답 단위: 날짜별 날씨 + 이벤트 */
export interface DayPlan {
  date: string;
  weather: DayWeather | null;
  events: EventItem[];
}
