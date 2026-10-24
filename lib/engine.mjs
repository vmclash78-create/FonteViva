import { TOPICS, detectTopic } from "./topics.mjs";
import { buildQuery, normalize, scoreText } from "./query.mjs";
import { PROVIDERS, KINDS, hostOf } from "./providers.mjs";
const KIND_WEIGHT = { checagem: 3, dado: 3, legislativo: 2.5, oficial: 2.5, web_oficial: 2.2, web: 1, contexto: 0.4 };
function canonicalUrl(url) { try { const u = new URL(url); for (const k of [...u.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/.test(k)) u.searchParams.delete(k); u.hash = ""; return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "") + u.search).toLowerCase(); } catch { return String(url); } }
function isOfficialDomain(domain, config) { return config.domains.some((d) => domain === d || domain.endsWith("." + d)); }
function hasNumberMatch(numbers, corpus) { if (!numbers.length) return false; const flat = corpus.replace(/(\d)[.,](\d)/g, "$1$2"); return numbers.some((n) => { const digits = n.replace(/\D/g, ""); return digits.length >= 2 && new RegExp("(^|\\D)" + digits + "(\\D|$)").test(flat); }); }
function ageBonus(date, nowYear) { const m = String(date ?? "").match(/\b(?:19|20)\d{2}\b/); if (!m) return 0; const age = nowYear - Number(m[0]); if (age <= 0) return 0.3; if (age === 1) return 0.2; return age <= 3 ? 0.1 : 0; }
/** Ordenação heurística: indica proximidade com a pesquisa, não que a página confirme a alegação. */
export function rankResults(rawResults, q, config, nowYear = new Date().getFullYear()) {
 const seen = new Map();
 for (const r of rawResults) {
  if (!/^https?:\/\//i.test(r.url || "")) continue;
  const domain = hostOf(r.url), official = isOfficialDomain(domain, config), corpus = r.title + " " + r.snippet;
  const relevance = Math.min(1, scoreText(q.searchString, corpus)), strong = r.kind === "checagem" || r.kind === "dado";
  if (relevance < (strong ? 0.1 : 0.25)) continue;
  const numberHit = hasNumberMatch(q.numbers, corpus), recent = ageBonus(r.date, nowYear);
  const kind = r.kind === "web" && official ? "web_oficial" : r.kind;
  const score = (KIND_WEIGHT[kind] ?? 1) + relevance * 3 + (numberHit ? 1.5 : 0) + (official ? 0.5 : 0) + recent;
  const item = { title: r.title, url: r.url, domain, snippet: r.snippet, date: r.date || null, kind, sourceType: KINDS[kind] || "Resultado web", numberMatch: numberHit, score: Math.round(score * 100) / 100 };
  const key = canonicalUrl(r.url); if (!seen.has(key) || seen.get(key).score < item.score) seen.set(key, item);
 }
 return [...seen.values()].sort((a, b) => b.score - a.score);
}
export async function runSearch({ query, topic = "geral", env = {}, fetchImpl = fetch, nowYear = new Date().getFullYear() }) {
 const q = buildQuery(query), normalizedAll = normalize(q.text);
 const resolvedTopic = TOPICS[topic] && topic !== "geral" ? topic : detectTopic(normalizedAll), config = TOPICS[resolvedTopic] || TOPICS.geral;
 const active = PROVIDERS.filter((p) => !p.topics || p.topics.includes(resolvedTopic));
 const settled = await Promise.allSettled(active.map(async (p) => { if (p.envKey && !env[p.envKey]) return { skipped: true }; return { items: await p.run({ q, topic: resolvedTopic, env, fetchImpl }) }; }));
 const providers = [], collected = [];
 settled.forEach((res, i) => { const p = active[i]; if (res.status === "rejected") { providers.push({ id: p.id, name: p.name, ok: false, error: "Falha ao consultar (" + (res.reason?.message || "erro") + ")." }); return; } if (res.value.skipped) { if (!p.silentWhenMissing) providers.push({ id: p.id, name: p.name, ok: false, skipped: true, error: p.hint }); return; } providers.push({ id: p.id, name: p.name, ok: true, count: res.value.items.length }); collected.push(...res.value.items); });
 const ranked = rankResults(collected, q, config, nowYear);
 return { query: q, topic: resolvedTopic, topicLabel: config.label, providers, results: ranked.filter((r) => r.kind !== "contexto").slice(0, 15), context: ranked.filter((r) => r.kind === "contexto").slice(0, 3), searchedAt: new Date().toISOString(), note: "Resultados de pesquisa são pistas para investigação, não vereditos factuais. Confira sempre a fonte original." };
}
