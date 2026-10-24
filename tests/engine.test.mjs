import test from "node:test";
import assert from "node:assert/strict";
import { runSearch, rankResults } from "../lib/engine.mjs";
import { buildQuery } from "../lib/query.mjs";
import { TOPICS } from "../lib/topics.mjs";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
function fakeFetch(routes) { return async (url) => { const u = String(url); for (const [part, handler] of Object.entries(routes)) if (u.includes(part)) return typeof handler === "function" ? handler(u) : handler; return json({}, 404); }; }
test("combina fontes gratuitas, ordena e marca número citado", async () => {
 const fetchImpl = fakeFetch({
 "dadosabertos.camara.leg.br": json({ dados: [{ id: 1, siglaTipo: "PL", numero: 10, ano: 2024, ementa: "Dispõe sobre o desemprego e emprego formal" }] }),
 "servicodados.ibge.gov.br": json({ items: [{ titulo: "Desocupação cai para 6,5% no trimestre", introducao: "<p>A taxa de desemprego ficou em 6,5% em 2024.</p>", link: "https://agenciadenoticias.ibge.gov.br/x", data_publicacao: "01/10/2024" }] }),
 "pt.wikipedia.org": json({ query: { search: [{ title: "Desemprego", pageid: 5, snippet: "desemprego é <span>situação</span>", timestamp: "2024-01-01T00:00:00Z" }] } })
 });
 const out = await runSearch({ query: "O desemprego caiu para 6,5% em 2024", env: {}, fetchImpl });
 assert.equal(out.topic, "economia"); assert.ok(out.results.length >= 2); assert.equal(out.results[0].domain, "agenciadenoticias.ibge.gov.br"); assert.equal(out.results[0].numberMatch, true); assert.ok(out.results.every((r) => r.kind !== "contexto")); assert.ok(out.context.some((r) => r.kind === "contexto"));
});
test("uma fonte fora do ar não derruba as outras", async () => {
 const fetchImpl = fakeFetch({ "dadosabertos.camara.leg.br": json({}, 500), "servicodados.ibge.gov.br": json({ items: [{ titulo: "Inflação oficial", introducao: "IPCA", link: "https://ibge.gov.br/a", data_publicacao: "2024" }] }), "pt.wikipedia.org": json({ query: { search: [] } }) });
 const out = await runSearch({ query: "inflação IPCA", env: {}, fetchImpl }); assert.ok(out.providers.find((p) => p.id === "camara" && !p.ok)); assert.ok(out.providers.find((p) => p.id === "ibge" && p.ok)); assert.ok(out.results.length >= 1);
});
test("busca aberta GDELT funciona sem chave e inclui resultados de notícias e checagens", async () => {
 const fetchImpl = fakeFetch({ "api.gdeltproject.org": (u) => json({ articles: [{ title: "Checagem sobre vacina", url: u.includes("domain%3A") || u.includes("domain:") ? "https://lupa.news/a" : "https://g1.globo.com/a", seendate: "20261024T120000Z" }] }), "dadosabertos": json({}), "servicodados": json({}), "wikipedia": json({ query: { search: [] } }) });
 const out = await runSearch({ query: "vacina causa X", env: {}, fetchImpl }); assert.ok(out.providers.find((p) => p.id === "gdelt" && p.ok)); assert.ok(out.providers.every((p) => !p.skipped));
});
test("Banco Central sem período na fala devolve o valor mais recente, avisando que não comprova outras datas", async () => {
 let called = ""; const fetchImpl = fakeFetch({ "bcdata.sgs.432": (u) => { called = u; return json([{ data: "15/10/2026", valor: "14.75" }]); }, "dadosabertos": json({}), "servicodados": json({}), "wikipedia": json({}) });
 const out = await runSearch({ query: "A Selic está em 14,75%", env: {}, fetchImpl }); const item = out.results.find((r) => r.kind === "dado"); assert.match(called, /ultimos\/1/); assert.match(item.snippet, /não cita período/); assert.match(item.snippet, /14,75/);
});
test("Banco Central respeita o ano citado na fala", async () => {
 let called = ""; const fetchImpl = fakeFetch({ "bcdata.sgs.432": (u) => { called = u; return json([{ data: "01/02/2023", valor: "13.75" }, { data: "02/08/2023", valor: "13.25" }, { data: "01/12/2023", valor: "11.75" }]); }, "dadosabertos": json({}), "servicodados": json({}), "wikipedia": json({}) });
 const out = await runSearch({ query: "A Selic terminou 2023 em 11,75%", env: {}, fetchImpl }); const item = out.results.find((r) => r.kind === "dado"); assert.match(called, /dataInicial=01\/01\/2023&dataFinal=31\/12\/2023/); assert.match(item.snippet, /Período citado \(2023\)/); assert.match(item.snippet, /mínimo 11,75, máximo 13,75/);
});
test("fonte sem resultados não é tratada como falha", async () => {
 const fetchImpl = fakeFetch({ "dadosabertos.camara.leg.br": json({ dados: [] }), "servicodados": json({ items: [] }), "pt.wikipedia.org": json({}, 500) });
 const out = await runSearch({ query: "desemprego em 2024", env: {}, fetchImpl }); const camara = out.providers.find((p) => p.id === "camara"); assert.equal(camara.ok, true); assert.equal(camara.count, 0); assert.equal(out.providers.find((p) => p.id === "wikipedia").ok, false);
});
test("recência considera a idade da data, não apenas o ano", () => { const q = buildQuery("desemprego"); const mk = (date) => ({ title: "desemprego", url: "https://ibge.gov.br/" + date, snippet: "desemprego", date, kind: "oficial" }); const [recent, old] = [rankResults([mk("2026")], q, TOPICS.economia, 2026)[0], rankResults([mk("2023")], q, TOPICS.economia, 2026)[0]]; assert.ok(recent.score > old.score); });
test("rankResults remove duplicatas, links inválidos e resultados sem relação", () => {
 const q = buildQuery("desemprego em 2024"); const raw = [{ title: "Desemprego 2024", url: "https://ibge.gov.br/a?utm_source=x", snippet: "desemprego 2024", kind: "oficial" }, { title: "Desemprego 2024", url: "https://www.ibge.gov.br/a/", snippet: "desemprego 2024", kind: "oficial" }, { title: "Receita de bolo", url: "https://exemplo.com/bolo", snippet: "farinha e ovos", kind: "web" }, { title: "Ruim", url: "javascript:alert(1)", snippet: "desemprego", kind: "web" }];
 const ranked = rankResults(raw, q, TOPICS.economia); assert.equal(ranked.length, 1);
});
