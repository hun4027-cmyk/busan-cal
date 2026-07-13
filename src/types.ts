// 통합 도메인 타입 — 소스를 이 형태로 정규화한다.

export type SourceKind = "festival" | "culture" | "regular" | "beach";
export type Category =
  | "축제" | "행사" | "전시" | "공연" | "바다" | "드론쇼" | "마켓";

export interface EventItem {
  id: string;
  source: SourceKind;
  category: Category;
  title: string;
  startDate: string;
  endDate: string;
  place: string;
  lat: number | null;
  lng: number | null;
  thumbnail: string | null;
  outdoor: boolean;
  link: string | null;
  badge?: string | null;
}

export interface DayWeather {
  date: string;
  sky: string | null;
  precipType: string | null;
  pop: number | null;
  tempMin: number | null;
  tempMax: number | null;
  waveM: number | null;
  available: boolean;
}

/** 물때 극치(만조/간조) 1건 */
export interface TideEvent { time: string; type: string; levelCm: number | null; }

/** 생활지수 — 미세먼지·자외선·물때 (오늘 항목에만 부착) */
export interface LifeInfo {
  pm10: number | null;
  pm25: number | null;
  airGrade: string | null;
  uvIndex: number | null;
  uvGrade: string | null;
  tideStation: string | null;
  tides: TideEvent[];
}

export interface DayPlan {
  date: string;
  weather: DayWeather | null;
  events: EventItem[];
  life?: LifeInfo | null;
}
