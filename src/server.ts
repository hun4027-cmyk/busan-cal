import { createServer } from "node:http";
import { getTripPlan } from "./handler.ts";
import { requireKey } from "./config.ts";
import { airUrl, parseAir } from "./sources/air.ts";
import { uvUrl, parseUv } from "./sources/uv.ts";

const PORT = Number(process.env.PORT ?? 3000);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIDE_BASE = "https://apis.data.go.kr/1192136/tideFcstHghLw";

async function rawFetch(target: string) {
  const r = await fetch(target, { headers: { "User-Agent": "busan-cal/0.1" } });
  return { status: r.status, body: await r.text() };
}

const server = createServer(async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const json = (o: unknown) => { res.writeHead(200, cors); res.end(JSON.stringify(o, null, 2)); };

  if (url.pathname === "/") return json({ ok: true, service: "busan-cal" });

  if (url.pathname === "/debug/air") {
    try { const { status, body } = await rawFetch(airUrl());
      let parsed: unknown = null; try { parsed = parseAir(JSON.parse(body)); } catch {}
      return json({ status, parsed, bodySnippet: body.slice(0, 500) });
    } catch (e) { return json({ error: (e as Error).message }); }
  }
  if (url.pathname === "/debug/uv") {
    try { const { status, body } = await rawFetch(uvUrl());
      let parsed: unknown = null; try { parsed = parseUv(JSON.parse(body)); } catch {}
      return json({ status, parsed, bodySnippet: body.slice(0, 700) });
    } catch (e) { return json({ error: (e as Error).message }); }
  }
  if (url.pathname === "/debug/tide") {
    try {
      const qs = new URLSearchParams(url.search);   // 내가 붙이는 파라미터 그대로 전달
      qs.set("serviceKey", requireKey());
      const { status, body } = await rawFetch(`${TIDE_BASE}?${qs}`);
      const sent = Object.fromEntries([...qs].filter(([k]) => k !== "serviceKey"));
      return json({ status, sent, bodySnippet: body.slice(0, 900) });
    } catch (e) { return json({ error: (e as Error).message }); }
  }

  if (url.pathname === "/trip") {
    const start = url.searchParams.get("start") ?? "";
    const end = url.searchParams.get("end") ?? "";
    if (!DATE_RE.test(start) || !DATE_RE.test(end)) { res.writeHead(400, cors); return res.end(JSON.stringify({ error: "start/end는 YYYY-MM-DD 형식이어야 합니다." })); }
    if (start > end) { res.writeHead(400, cors); return res.end(JSON.stringify({ error: "start가 end보다 늦을 수 없습니다." })); }
    try { const plan = await getTripPlan(start, end); res.writeHead(200, cors); return res.end(JSON.stringify(plan)); }
    catch (e) { res.writeHead(500, cors); return res.end(JSON.stringify({ error: (e as Error).message })); }
  }

  res.writeHead(404, cors);
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => console.log(`▶ busan-cal API http://localhost:${PORT}`));
