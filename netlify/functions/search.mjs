import { runSearch } from "../../lib/engine.mjs";
import { normalize } from "../../lib/query.mjs";
const BASE = { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff" };
const reply = (status, body, cache = "no-store") => new Response(JSON.stringify(body), { status, headers: { ...BASE, "cache-control": cache } });
const CACHE_TTL = 10 * 60 * 1000, CACHE_MAX = 200, RATE_MAX = 20, RATE_WINDOW = 60 * 1000;
const cache = new Map(), hits = new Map();
function limited(ip, now) {
 const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW); recent.push(now); hits.set(ip, recent);
 if (hits.size > 1000) { for (const [key, times] of hits) if (!times.length || now - times[times.length - 1] > RATE_WINDOW) hits.delete(key); while (hits.size > 5000) hits.delete(hits.keys().next().value); }
 return recent.length > RATE_MAX;
}
export default async (request, context) => {
 if (request.method !== "GET") return reply(405, { error: "Método não permitido." });
 const now = Date.now(), ip = context?.ip || request.headers.get("x-nf-client-connection-ip") || "anon";
 if (limited(ip, now)) return reply(429, { error: "Muitas pesquisas em pouco tempo. Aguarde um minuto e tente novamente." });
 const url = new URL(request.url), query = (url.searchParams.get("q") || "").trim(), topic = (url.searchParams.get("topic") || "geral").toLowerCase();
 if (query.length < 2) return reply(400, { error: "Digite uma afirmação ou termos de pesquisa." });
 if (query.length > 300) return reply(400, { error: "A consulta é longa demais. Limite a pesquisa a 300 caracteres." });
 const key = topic + "|" + normalize(query), hit = cache.get(key);
 if (hit && now - hit.at < CACHE_TTL) return reply(200, { ...hit.payload, cached: true }, "public, max-age=300");
 let payload;
 try { payload = await runSearch({ query, topic, env: process.env }); }
 catch { return reply(502, { error: "Erro inesperado ao pesquisar. Tente novamente." }); }
 if (!payload.providers.some((p) => p.ok)) return reply(503, { error: "Nenhuma fonte respondeu agora. Tente novamente em instantes.", providers: payload.providers });
 const out = { ...payload, provider: payload.providers.filter((p) => p.ok).map((p) => p.name).join(", ") };
 if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
 cache.set(key, { at: now, payload: out });
 return reply(200, out, "public, max-age=300");
};
