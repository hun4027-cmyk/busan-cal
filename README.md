# 부산 캘린더 — 데이터 파이프라인 스켈레톤

여행 날짜를 넣으면 그 기간 부산의 **축제·전시·공연·정기이벤트**를 **날씨**와 함께 날짜별로 묶어주는 백엔드 스켈레톤.

## 구조
```
src/
  types.ts            통합 도메인 타입 (EventItem, DayWeather, DayPlan)
  config.ts           키/좌표/TTL 상수 (키는 환경변수)
  util.ts             날짜·HTTP 유틸 (의존성 0)
  cache.ts            인메모리 TTL 캐시 (→ 운영 시 KV/Redis 교체)
  sources/
    festival.ts       축제  · TourAPI            ✅ 실호출 검증됨
    culture.ts        전시/공연/행사 · 문화정보원  ✅ 실호출 검증됨 (부산 클라 필터)
    weather.ts        날씨 오케스트레이터(단기+중기 병합, 예보~10일)
    weather-short.ts  단기예보(0~3일)             ✅ 실호출 검증됨(부산 nx=98,ny=76)
    weather-mid.ts    중기예보(4~10일, 육상+기온)  ✅ 실호출 검증됨(regId·4일차 시작 확정)
    regular.ts        정기이벤트 · 수동 JSON       📝 큐레이션
    beach.ts          해수욕장 · 부산 7곳 정적목록  ✅ (그날 물놀이 지수는 날씨로 계산)
  swim.ts             물놀이 지수 배지(강수·기온·파고 WAV 기반, 수온 미포함)
  handler.ts          오케스트레이션 (소스별 캐시 → 날짜별 묶기 + 해수욕장 배지 부착)
  server.ts           HTTP 엔드포인트 GET /trip — 미니앱이 호출하는 단일 백엔드
  index.ts            CLI 데모
data/
  regular-events.json 드론쇼·나이트마켓·플리마켓 (반복규칙)
```

## 설계 원칙
- **백엔드가 3소스를 모아 정규화·캐시** → 미니앱은 `getTripPlan()` 결과만 소비.
- **캐시로 비용을 사용자 수와 분리**: API를 사용자마다가 아니라 소스마다 주기 호출.
- **한 소스가 실패해도 나머지는 노출**(handler의 `.catch`).

## 실행
```bash
# Node 22.6+ (타입 스트리핑). 그 이하면 `npm run build` 후 dist 실행.
export DATA_GO_KR_KEY="발급한 data.go.kr 인증키"
node --experimental-strip-types src/index.ts 2026-08-01 2026-08-03   # CLI 데모
```

### API 서버 (미니앱이 호출)
```bash
export DATA_GO_KR_KEY="..."          # 없어도 해수욕장·정기이벤트는 응답
npm run serve                         # http://localhost:3000
# GET /trip?start=2026-08-01&end=2026-08-03  → DayPlan[] (JSON, CORS 허용)
```
프론트(`busan-cal-app`)의 `api.ts` `BACKEND_URL`을 이 주소(배포 시 서버리스 URL)로 맞추면 연결됨.
서버리스(Vercel/Cloudflare) 이전 시 `handler.ts`의 `getTripPlan`만 재사용.

## 배포 (Node 서버 · Docker)
런타임 의존성 0이라 `Dockerfile` 하나로 어디든 올라가요. 항상 켜진 작은 Node 서버로 운영.

**공통 준비**: `busan-cal/`를 GitHub에 푸시 → 아래 호스트에서 repo 연결 → 환경변수 **`DATA_GO_KR_KEY`** 설정.

- **Render**: New → Web Service → repo 선택 → Runtime = Docker(Dockerfile 자동 감지) → Env에 `DATA_GO_KR_KEY` → Create. 발급 URL 예: `https://busan-cal.onrender.com`
  - Docker 없이 갈 땐: Build 없음 / Start `node --experimental-strip-types src/server.ts` / Node 22.
- **Railway**: New Project → Deploy from repo(Dockerfile 감지) → Variables에 `DATA_GO_KR_KEY`.
- **Fly.io**: `fly launch`(Dockerfile 감지) → `fly secrets set DATA_GO_KR_KEY=발급키` → `fly deploy`.

**배포 후 확인**
```
GET https://<배포주소>/                      → {"ok":true,...}
GET https://<배포주소>/trip?start=2026-08-01&end=2026-08-03  → DayPlan[]
```
그다음 프론트 `busan-cal-app/src/api.ts`의 `BACKEND_URL`을 배포주소로 교체.

> ⚠️ `DATA_GO_KR_KEY` 없으면 서버는 뜨지만 해수욕장·정기이벤트만 응답(축제·전시·날씨는 빈값). 반드시 환경변수로 넣을 것.
> 무료 티어는 유휴 시 슬립될 수 있음(첫 요청 지연). 필요 시 유료 인스턴스나 헬스핑으로 상시화.

## 남은 것 (스켈레톤 이후)
- [x] 기상청 단기예보 **라이브 검증** + 격자 nx=98, ny=76 확정
- [x] 기상청 **중기예보(4~10일)** 연동 구현 + **라이브 검증 완료**
      (regId 육상 11H20000 / 기온 11H20201, 필드 4일차 시작, 날짜=발표일+N)
- [ ] 정기이벤트 `_verified:false` 항목(나이트마켓·플리마켓) 실제 일정 확인
- [ ] 카테고리 정렬 규칙 확정(현재 야외 우선 임시)
- [ ] 미니앱 프론트 연동(앱인토스) + 배포(서버리스)

## 검증 상태
| 소스 | 상태 |
|---|---|
| 축제(TourAPI) | ✅ 실응답 확인 (부산 4건) |
| 전시/공연/행사(문화정보원) | ✅ 실응답 확인 (필드·좌표·썸네일) |
| 날씨 단기(기상청) | ✅ 실호출 검증됨 |
| 날씨 중기(기상청) | ✅ 실호출 검증됨(regId 11H20000/11H20201, 4일차 시작) |
| 해수욕장 | ✅ 부산 7곳 + 물놀이 지수(날씨 기반) / 개장기간·수온은 확장 |
| 정기이벤트 | ✅ 드론쇼(토)·밀락더마켓 마켓나이트(매일) 확정 / F1963 망미장은 비정기 → 공식 공지로 날짜 채우기 |
