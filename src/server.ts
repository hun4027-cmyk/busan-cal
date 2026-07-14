import { createServer } from "node:http";
import { getTripPlan } from "./handler.ts";

const PORT = Number(process.env.PORT ?? 3000);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TERMS_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>부산 캘린더 서비스 이용약관</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;max-width:720px;margin:0 auto;padding:24px 20px 60px;color:#181F29;line-height:1.7;font-size:15px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 8px}p,li{margin:6px 0}ol{padding-left:20px}.meta{color:#8B95A1;font-size:13px;margin-top:40px;border-top:1px solid #EAECEF;padding-top:16px}</style></head><body>
<h1>부산 캘린더 서비스 이용약관</h1>
<h2>제1조 (목적)</h2><p>이 약관은 '부산 캘린더'(이하 "서비스")를 운영하는 자(이하 "회사")가 앱인토스(토스 미니앱) 환경에서 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.</p>
<h2>제2조 (정의)</h2><ol><li>"서비스"란 부산 지역의 축제·전시·공연·해수욕장·행사 정보와 날씨 및 생활지수(미세먼지·물때 등), 길찾기 등을 날짜별로 제공하는 정보 서비스를 말합니다.</li><li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li><li>이 약관에서 정하지 않은 용어는 관계 법령 및 일반 관례에 따릅니다.</li></ol>
<h2>제3조 (약관의 효력 및 변경)</h2><ol><li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li><li>회사는 관계 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 사전에 공지합니다.</li><li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.</li></ol>
<h2>제4조 (서비스의 내용)</h2><p>회사는 다음 각 호의 서비스를 제공합니다.</p><ol><li>부산 지역 축제·전시·공연·해수욕장·정기행사 및 주요 행사 정보의 날짜별 조회</li><li>기상 정보 및 생활지수(미세먼지·물때 등) 제공</li><li>실내/야외 구분, 해수욕장 물놀이 지수 등 부가 정보 제공</li><li>장소별 외부 지도 서비스를 통한 길찾기 연결</li><li>기타 회사가 추가로 개발하거나 제휴를 통해 이용자에게 제공하는 일체의 서비스</li></ol>
<h2>제5조 (정보의 출처 및 정확성)</h2><ol><li>서비스가 제공하는 정보는 공공데이터포털, 기상청, 한국관광공사, 한국문화정보원, 한국환경공단(에어코리아), 국립해양조사원 등 공공기관이 제공하는 데이터 및 회사가 수집·정리한 자료를 기반으로 합니다.</li><li>회사는 정보의 정확성·완전성·최신성을 위해 노력하나, 원천 데이터의 오류·지연·변경 등으로 인해 실제 정보와 다를 수 있으며 이를 보증하지 않습니다.</li><li>행사 일정·장소·운영 여부, 해수욕장 개장 여부, 기상·생활지수 등은 사정에 따라 변경·취소될 수 있으므로, 이용자는 방문·이용 전 해당 기관 또는 주최 측을 통해 최종 확인할 책임이 있습니다.</li></ol>
<h2>제6조 (서비스의 변경 및 중단)</h2><ol><li>회사는 서비스의 내용을 변경하거나 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 중단할 수 있습니다.</li><li>원천 데이터 제공 중단, 천재지변, 시스템 장애 등 불가항력적 사유로 서비스가 중단될 수 있으며, 이 경우 회사는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</li></ol>
<h2>제7조 (광고의 게재)</h2><ol><li>회사는 서비스 운영을 위하여 서비스 화면에 광고를 게재할 수 있습니다.</li><li>광고에는 앱인토스가 제공하는 광고가 포함될 수 있으며, 이용자가 광고를 클릭하여 외부로 이동하는 경우 해당 광고주의 페이지로 연결됩니다.</li><li>광고주가 게재하거나 이를 통해 연결된 외부 서비스의 내용 및 거래에 대하여 회사는 책임을 지지 않습니다.</li></ol>
<h2>제8조 (외부 서비스 및 링크)</h2><ol><li>서비스는 길찾기 등 이용자 편의를 위해 외부 지도 서비스 등 제3자 서비스로 연결되는 링크를 제공할 수 있습니다.</li><li>외부 서비스에는 해당 사업자의 약관 및 정책이 적용되며, 회사는 외부 서비스의 내용·정확성·거래에 대하여 책임을 지지 않습니다.</li></ol>
<h2>제9조 (이용자의 의무)</h2><p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p><ol><li>서비스의 정상적인 운영을 방해하는 행위</li><li>회사 또는 제3자의 지적재산권을 침해하는 행위</li><li>자동화된 수단을 이용하여 서비스의 정보를 과도하게 수집·복제하는 행위</li><li>관계 법령 또는 이 약관에 위반되는 행위</li></ol>
<h2>제10조 (지적재산권)</h2><ol><li>서비스 및 그 구성요소(디자인, 화면구성, 편집물 등)에 대한 저작권 및 지적재산권은 회사에 귀속됩니다. 다만 공공데이터 및 제3자로부터 제공받은 정보에 대한 권리는 각 제공자에게 귀속됩니다.</li><li>이용자는 회사의 사전 동의 없이 서비스를 영리 목적으로 복제·배포·가공하거나 제3자에게 이용하게 할 수 없습니다.</li></ol>
<h2>제11조 (개인정보의 보호)</h2><p>회사는 서비스 제공을 위하여 필요한 최소한의 정보만을 처리하며, 개인정보의 처리에 관한 사항은 관계 법령 및 앱인토스의 정책에 따릅니다.</p>
<h2>제12조 (책임의 제한 및 면책)</h2><ol><li>회사는 무료로 제공되는 서비스의 이용과 관련하여 관계 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</li><li>회사는 이용자가 서비스의 정보를 신뢰하여 행한 판단이나 활동(방문, 이동, 물놀이 등)의 결과에 대하여 책임을 지지 않습니다.</li><li>회사는 이용자 상호간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대하여 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.</li></ol>
<h2>제13조 (준거법 및 관할)</h2><ol><li>이 약관은 대한민국 법령에 따라 해석되고 적용됩니다.</li><li>서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁에 관한 소송의 관할은 민사소송법이 정하는 바에 따릅니다.</li></ol>
<h2>부칙</h2><p>이 약관은 2026년 7월 14일부터 시행합니다.</p>
<div class="meta"><p>시행일: 2026년 7월 14일</p><p>운영자: KAM</p><p>문의처: hun4027@gmail.com</p></div>
</body></html>`;

const server = createServer(async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/") { res.writeHead(200, cors); return res.end(JSON.stringify({ ok: true, service: "busan-cal" })); }

  if (url.pathname === "/terms") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    return res.end(TERMS_HTML);
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
