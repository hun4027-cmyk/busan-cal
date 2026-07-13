import { createServer } from "node:http";
import { getTripPlan } from "./handler.ts";
import { requireKey } from "./config.ts";

const PORT = Number(process.env.PORT ?? 3000);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
async function rawFetch(t: string) { const r = await fetch(t, { headers: { "User-Agent": "busan-cal/0.1" } }); return { status: r.status, body: await r.text() }; }

const server = createServer(async (req, res) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Content-Type": "application/json; charset=utf-8" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const json = (o: unknown) => { res.writeHead(200, cors); res.end(JSON.stringify(o, null, 2)); };

  if (url.pathname === "/") return json({ ok: true, service: "busan-cal" });

  if (url.pathname === "/debug/uv") {
    try {
      const key = requireKey();
      const k = new Date(Date.now() + 9 * 3600 * 1000);
      const p = (n: number) => String(n).padStart(2, "0");
      const t = url.searchParams.get("t") ?? `${k.getUTCFullYear()}${p(k.getUTCMonth() + 1)}${p(k.getUTCDate())}06`;
      const qs = new URLSearchParams({ serviceKey: key, dataType: "JSON", numOfRows: "10", pageNo: "1", areaNo: "2600000000", time: t });
      const { status, body } = await rawFetch(`https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4?${qs}`);
      return json({ status, time: t, bodySnippet: body.slice(0, 700) });
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
