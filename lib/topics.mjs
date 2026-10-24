// Configuração de assuntos: domínios oficiais usados como prioridade no ranking
// para priorizar fontes oficiais no ranking dos resultados.
export const TOPICS = {
  geral: { label: "fontes oficiais e institucionais", domains: ["gov.br", "leg.br", "jus.br", "ibge.gov.br", "ipea.gov.br", "fiocruz.br", "who.int", "un.org"] },
  governo: { label: "governo, legislação e órgãos públicos", domains: ["gov.br", "planalto.gov.br", "camara.leg.br", "senado.leg.br", "stf.jus.br", "stj.jus.br", "tse.jus.br", "tcu.gov.br", "cgu.gov.br", "portaldatransparencia.gov.br", "dados.gov.br", "jus.br"] },
  saude: { label: "saúde pública e pesquisa médica", domains: ["gov.br", "saude.gov.br", "fiocruz.br", "anvisa.gov.br", "ans.gov.br", "who.int", "paho.org", "pubmed.ncbi.nlm.nih.gov"] },
  economia: { label: "estatísticas e instituições econômicas", domains: ["ibge.gov.br", "bcb.gov.br", "ipea.gov.br", "ipeadata.gov.br", "gov.br", "tesourotransparente.gov.br", "portaldatransparencia.gov.br", "worldbank.org", "imf.org", "oecd.org"] },
  ciencia: { label: "instituições científicas e publicações de pesquisa", domains: ["gov.br", "fiocruz.br", "inpe.br", "capes.gov.br", "pubmed.ncbi.nlm.nih.gov", "nature.com", "science.org", "who.int"] },
  eleicoes: { label: "justiça eleitoral e órgãos oficiais", domains: ["tse.jus.br", "dadosabertos.tse.jus.br", "gov.br", "camara.leg.br", "senado.leg.br"] }
};
export const FACTCHECK_DOMAINS = ["aosfatos.org", "lupa.news", "projetocomprova.com.br", "estadao.com.br", "g1.globo.com", "boatos.org"];
const RULES = [
  ["saude", /\b(vacin\w*|sus|saude|hospital\w*|doenc\w*|covid\w*|dengue|anvisa|remedio\w*|medic\w*)\b/],
  ["economia", /\b(inflacao|ipca|selic|pib|desemprego|desocupacao|juros|divida|imposto\w*|salario\w*|dolar|cambio|renda|orcamento|deficit|superavit)\b/],
  ["eleicoes", /\b(eleic\w*|urna\w*|voto\w*|candidat\w*|tse|partido\w*|pesquisa eleitoral)\b/],
  ["ciencia", /\b(clima\w*|aquecimento|desmatamento|queimada\w*|estudo\w*|pesquisa\w*|cientist\w*|emiss\w*)\b/],
  ["governo", /\b(lei|leis|projeto de lei|decreto\w*|stf|stj|ministr\w*|congresso|camara|senado|deputad\w*|senador\w*|constituicao|governo)\b/]
];
export function detectTopic(normalizedText) {
  for (const [topic, regex] of RULES) if (regex.test(normalizedText)) return topic;
  return "geral";
}
