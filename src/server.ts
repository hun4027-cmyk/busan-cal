import { createServer } from "node:http";
import { getTripPlan } from "./handler.ts";

const PORT = Number(process.env.PORT ?? 3000);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const server = createServer(async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/") {
    res.writeHead(200, cors);
    return res.end(JSON.stringify({ ok: true, service: "busan-cal" }));
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
