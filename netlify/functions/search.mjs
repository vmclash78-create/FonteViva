const TOPICS = {
  geral: { label: "fontes oficiais e institucionais", domains: ["gov.br", "leg.br", "jus.br", "ibge.gov.br", "ipea.gov.br", "fiocruz.br", "who.int", "un.org"] },
  governo: { label: "governo, legislação e órgãos públicos", domains: ["gov.br", "planalto.gov.br", "camara.leg.br", "senado.leg.br", "stf.jus.br", "stj.jus.br", "tse.jus.br", "jus.br"] },
  saude: { label: "saúde pública e pesquisa médica", domains: ["gov.br", "saude.gov.br", "fiocruz.br", "anvisa.gov.br", "who.int", "paho.org", "pubmed.ncbi.nlm.nih.gov"] },
  economia: { label: "estatísticas e instituições econômicas", domains: ["ibge.gov.br", "bcb.gov.br", "ipea.gov.br", "gov.br", "tesourotransparente.gov.br", "worldbank.org", "imf.org", "oecd.org"] },
  ciencia: { label: "instituições científicas e publicações de pesquisa", domains: ["gov.br", "fiocruz.br", "inpe.br", "capes.gov.br", "pubmed.ncbi.nlm.nih.gov", "nature.com", "science.org", "who.int"] },
  eleicoes: { label: "justiça eleitoral e órgãos oficiais", domains: ["tse.jus.br", "tre-ce.jus.br", "gov.br", "camara.leg.br", "senado.leg.br"] }
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  },
  body: JSON.stringify(body)
});

function makeSearchQuery(query, topic) {
  const config = TOPICS[topic] || TOPICS.geral;
  const officialDomains = config.domains.map((domain) => "site:" + domain).join(" OR ");
  return { query: "(" + query.replace(/[\r\n]+/g, " ").slice(0, 250) + ") (" + officialDomains + ")", config };
}

export default async (request) => {
  if (request.method !== "GET") return json(405, { error: "Método não permitido." });
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const topic = (url.searchParams.get("topic") || "geral").toLowerCase();
  if (query.length < 2) return json(400, { error: "Digite uma afirmação ou termos de pesquisa." });
  if (query.length > 300) return json(400, { error: "A consulta é longa demais. Limite a pesquisa a 300 caracteres." });

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: "A pesquisa real ainda não está configurada no servidor. Defina BRAVE_SEARCH_API_KEY nas variáveis de ambiente do Netlify para habilitar consultas externas."
    });
  }

  const { query: searchQuery, config } = makeSearchQuery(query, topic);
  const endpoint = new URL("https://api.search.brave.com/res/v1/web/search");
  endpoint.searchParams.set("q", searchQuery);
  endpoint.searchParams.set("count", "10");
  endpoint.searchParams.set("country", "BR");
  endpoint.searchParams.set("search_lang", "pt-br");
  endpoint.searchParams.set("safesearch", "moderate");

  let response;
  try {
    response = await fetch(endpoint, {
      headers: { "Accept": "application/json", "X-Subscription-Token": apiKey },
      signal: AbortSignal.timeout(12000)
    });
  } catch {
    return json(502, { error: "Não foi possível alcançar o provedor de busca. Tente novamente mais tarde." });
  }
  if (response.status === 401 || response.status === 403) {
    return json(502, { error: "O provedor de busca recusou a chave configurada. Confira BRAVE_SEARCH_API_KEY no Netlify." });
  }
  if (response.status === 429) {
    return json(429, { error: "O limite de consultas do provedor foi atingido. Aguarde e tente novamente." });
  }
  if (!response.ok) return json(502, { error: "O provedor de busca retornou um erro (" + response.status + ")." });

  let data;
  try { data = await response.json(); }
  catch { return json(502, { error: "O provedor retornou uma resposta inválida." }); }

  const results = (data.web?.results || []).slice(0, 10).map((item) => {
    let domain = "";
    try { domain = new URL(item.url).hostname.replace(/^www\./, ""); } catch {}
    const isOfficial = config.domains.some((d) => domain === d || domain.endsWith("." + d));
    return {
      title: String(item.title || "").slice(0, 300),
      url: item.url,
      domain,
      snippet: String(item.description || "").slice(0, 1200),
      date: item.page_age || item.published || item.extra_snippets?.[0]?.published || null,
      sourceType: isOfficial ? "Domínio priorizado" : "Resultado externo"
    };
  }).filter((item) => /^https?:\/\//i.test(item.url || ""));

  return json(200, {
    provider: "Brave Search API",
    topicLabel: config.label,
    results,
    searchedAt: new Date().toISOString(),
    note: "Resultados de pesquisa são pistas para investigação, não vereditos factuais."
  });
};

export const __test = { makeSearchQuery, TOPICS };
