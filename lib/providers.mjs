import { TOPICS, FACTCHECK_DOMAINS } from "./topics.mjs";
const TIMEOUT = 8000;
async function getJson(fetchImpl, url, headers = {}) {
 const response = await fetchImpl(String(url), { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(TIMEOUT) });
 if (!response.ok) throw new Error("HTTP " + response.status);
 return response.json();
}
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
const stripHtml = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
export const KINDS = { checagem: "Checagem já publicada", dado: "Dado oficial", legislativo: "Proposição legislativa", oficial: "Publicação oficial", web_oficial: "Domínio oficial (web)", web: "Resultado web", contexto: "Contexto (não é fonte primária)" };
const camara = {
 id: "camara", name: "Câmara dos Deputados (dados abertos)", topics: ["geral", "governo", "eleicoes", "saude", "economia"],
 async run({ q, fetchImpl }) {
  if (!q.searchString) return [];
  const url = new URL("https://dadosabertos.camara.leg.br/api/v2/proposicoes");
  url.searchParams.set("keywords", q.keywords.slice(0, 5).join(" ")); url.searchParams.set("ordem", "DESC"); url.searchParams.set("ordenarPor", "id"); url.searchParams.set("itens", "10");
  const data = await getJson(fetchImpl, url);
  return (data.dados || []).map((p) => ({ title: [p.siglaTipo, p.numero && p.ano ? p.numero + "/" + p.ano : ""].filter(Boolean).join(" "), url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=" + p.id, snippet: p.ementa || "Sem ementa disponível.", date: p.ano ? String(p.ano) : null, kind: "legislativo" }));
 }
};
const ibge = {
 id: "ibge", name: "IBGE (notícias e estatísticas)", topics: ["geral", "economia", "governo", "saude", "ciencia"],
 async run({ q, fetchImpl }) {
  if (!q.searchString) return [];
  const url = new URL("https://servicodados.ibge.gov.br/api/v3/noticias/");
  url.searchParams.set("busca", q.keywords.slice(0, 4).join(" ")); url.searchParams.set("qtd", "8");
  const data = await getJson(fetchImpl, url);
  return (data.items || []).filter((n) => n.link).map((n) => ({ title: n.titulo, url: n.link, snippet: stripHtml(n.introducao), date: n.data_publicacao || null, kind: "oficial" }));
 }
};
const BCB_SERIES = [{ re: /\bselic\b/, code: 432, label: "Meta da taxa Selic (% ao ano)" }, { re: /\b(ipca|inflacao)\b/, code: 433, label: "IPCA — variação mensal (%)" }, { re: /\b(dolar|cambio)\b/, code: 1, label: "Dólar comercial, venda (R$)" }];
const pad = (n) => String(n).padStart(2, "0");
export function claimPeriod(q) {
 if (!q.years.length) return null;
 const y1 = Math.min(...q.years), y2 = Math.min(Math.max(...q.years), y1 + 9);
 if (q.years.length === 1 && q.months.length === 1) { const m = q.months[0], last = new Date(y1, m, 0).getDate(); return { start: "01/" + pad(m) + "/" + y1, end: pad(last) + "/" + pad(m) + "/" + y1, label: pad(m) + "/" + y1 }; }
 return { start: "01/01/" + y1, end: "31/12/" + y2, label: y1 === y2 ? String(y1) : y1 + "–" + y2 };
}
const fmt = (n) => String(n).replace(".", ",");
const bcb = {
 id: "bcb", name: "Banco Central (indicadores)", topics: ["geral", "economia", "governo"],
 async run({ q, fetchImpl }) {
  const hay = q.keywords.join(" "), period = claimPeriod(q), out = [];
  for (const s of BCB_SERIES.filter((x) => x.re.test(hay))) {
   const base = "https://api.bcb.gov.br/dados/serie/bcdata.sgs." + s.code + "/dados";
   const url = period ? base + "?formato=json&dataInicial=" + period.start + "&dataFinal=" + period.end : base + "/ultimos/1?formato=json";
   let rows; try { rows = await getJson(fetchImpl, url); } catch (e) { if (/404/.test(e.message)) continue; throw e; }
   if (!Array.isArray(rows) || !rows.length) continue;
   const last = rows[rows.length - 1]; let snippet;
   if (period) { const vals = rows.map((r) => parseFloat(r.valor)).filter((v) => Number.isFinite(v)); snippet = "Período citado (" + period.label + "): " + rows.length + " registro(s); mínimo " + fmt(Math.min(...vals)) + ", máximo " + fmt(Math.max(...vals)) + "; último valor do período: " + fmt(last.valor) + " (" + last.data + ")."; }
   else snippet = "A fala não cita período; este é o valor mais recente publicado: " + fmt(last.valor) + " (" + last.data + "). Não comprova alegações sobre outras datas.";
   out.push({ title: s.label + " — série SGS " + s.code + (period ? " — " + period.label : " — mais recente"), url, snippet, date: last.data, kind: "dado" });
  }
  return out;
 }
};
const wikipedia = {
 id: "wikipedia", name: "Wikipédia (contexto)",
 async run({ q, fetchImpl }) {
  if (!q.searchString) return [];
  const url = new URL("https://pt.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query"); url.searchParams.set("list", "search"); url.searchParams.set("srsearch", q.searchString); url.searchParams.set("srlimit", "4"); url.searchParams.set("format", "json"); url.searchParams.set("utf8", "1");
  const data = await getJson(fetchImpl, url, { "User-Agent": "FonteViva/0.3 (verificacao de fatos; contato via GitHub)" });
  return (data.query?.search || []).map((r) => ({ title: r.title, url: "https://pt.wikipedia.org/?curid=" + r.pageid, snippet: stripHtml(r.snippet), date: r.timestamp ? r.timestamp.slice(0, 10) : null, kind: "contexto" }));
 }
};
const gdelt = {
 id: "gdelt", name: "Busca aberta na web (GDELT, sem chave)",
 async run({ q, fetchImpl }) {
  if (!q.searchString) return [];
  const factDomains = FACTCHECK_DOMAINS.map((d) => "domain:" + d).join(" OR ");
  const requests = [{ query: q.text, kind: "web" }, { query: "(" + q.text + ") (" + factDomains + ")", kind: "checagem" }];
  const batches = await Promise.all(requests.map(async ({ query }) => {
   const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
   url.searchParams.set("query", query.slice(0, 250)); url.searchParams.set("mode", "ArtList"); url.searchParams.set("format", "json"); url.searchParams.set("maxrecords", "10"); url.searchParams.set("sort", "HybridRel");
   return getJson(fetchImpl, url);
  }));
  return batches.flatMap((data, i) => (data.articles || []).map((r) => ({ title: String(r.title || "Resultado da web").slice(0, 300), url: r.url, snippet: stripHtml(r.title || "Artigo encontrado pela busca aberta GDELT."), date: r.seendate ? String(r.seendate).slice(0, 8) : null, kind: requests[i].kind })));
 }
};
export const PROVIDERS = [camara, ibge, bcb, wikipedia, gdelt];
export { hostOf };
