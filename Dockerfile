# 부산 캘린더 백엔드 — Node 서버 배포용.
# 런타임 의존성 0 (Node 내장 http/fs만) → npm install 불필요. TS는 실행 시 스트립.
FROM node:22-alpine
WORKDIR /app

COPY package.json ./
COPY src ./src
COPY data ./data

ENV NODE_ENV=production
# PORT는 호스트가 주입(Render/Railway 등). 기본 3000.
EXPOSE 3000

CMD ["node", "--experimental-strip-types", "src/server.ts"]
