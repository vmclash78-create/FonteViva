# FonteViva

**Informação verificável. Evidências abertas. Conclusões proporcionais às fontes.**

FonteViva é uma plataforma de checagem de alegações projetada para ajudar pessoas a investigar afirmações com transparência. Em vez de tratar uma resposta automática como verdade, o produto organiza alegações, fontes, datas, evidências, limitações e histórico de revisão.

> **Estado do projeto:** MVP inicial em desenvolvimento. Os registros demonstrativos da interface são exemplos didáticos, não checagens editoriais publicadas.

## Princípios do produto

- **Rastreabilidade:** cada conclusão deve apontar para fontes consultáveis.
- **Incerteza explícita:** “não foi possível verificar” é um resultado válido.
- **Contexto:** diferenciar uma frase falsa, uma frase fora de contexto e uma frase parcialmente correta.
- **Independência:** separar evidência primária, jornalismo, análise e opinião.
- **Correções públicas:** registrar alterações de veredito, justificativa e fontes.
- **Sem autoridade artificial:** popularidade, repetição e confiança de um modelo não substituem evidência.

## O que existe neste MVP

- Interface responsiva em português.
- Busca gratuita, sem chave de API, cartão ou assinatura:
  - **Câmara dos Deputados:** proposições e projetos de lei por dados abertos.
  - **IBGE:** notícias e publicações estatísticas oficiais.
  - **Banco Central:** indicadores econômicos, como Selic, IPCA e dólar, quando relacionados à consulta.
  - **Wikipédia:** somente para contexto, claramente separada de evidências.
  - **GDELT:** busca aberta de notícias e páginas na web, incluindo domínios de checagem.
- Extração de números, nomes e palavras-chave da fala, com detecção automática de assunto.
- Ranking heurístico, priorização de fontes oficiais e remoção de duplicatas.
- Cache de 10 minutos e limite de melhor esforço de 20 pesquisas por minuto por IP.
- Se uma fonte falhar, as outras continuam; a interface informa o estado de cada fonte.

## Executar e publicar

Requer Node.js 20 ou superior.

```bash
npm run check
npm test
```

Para publicar, importe o repositório no Netlify. A função de servidor fica em `netlify/functions/search.mjs`. **Nenhuma variável de ambiente ou chave de API é obrigatória.** Os provedores usam endpoints públicos gratuitos, sujeitos aos limites e à disponibilidade de cada serviço.

## Limitações importantes

- **Cobertura:** as fontes oficiais cobrem temas específicos. O GDELT amplia a busca, mas não é ilimitado e pode deixar de encontrar páginas relevantes.
- **Ranking heurístico:** a ordem indica proximidade com a pesquisa, não que a página confirme a alegação. Encontrar o mesmo número ou palavra não é prova.
- **Indicadores:** se a fala cita um ano (ou mês e ano), a consulta ao Banco Central usa esse período. Sem período, o valor mostrado é o mais recente e não comprova alegações sobre outras datas.
- **Cache e limite de pesquisas:** ficam na memória de cada instância serverless; podem desaparecer e não são compartilhados globalmente.
- **Falha não é ausência de evidência:** a interface diferencia fonte indisponível de fonte consultada sem resultados. Nenhuma das duas situações prova que a alegação seja falsa.
- **Wikipédia:** aparece em seção separada de contexto e nunca é tratada como fonte primária.
- **Sem vereditos automáticos:** o sistema não transforma resultados de busca em “verdadeiro” ou “falso”.

A busca recupera **páginas candidatas**; ela não produz, sozinha, um veredito factual. Os resumos exibidos são metadados e trechos fornecidos pelas fontes, não uma leitura integral do documento.

## Próximas etapas

1. Ler o conteúdo das páginas e extrair trechos que sustentem ou contradigam a fala.
2. Avaliar contradições entre fontes e justificar conclusões proporcionais à evidência.
3. Integrar mais fontes oficiais, como SIDRA/IBGE, Portal da Transparência e TSE.
4. Criar painel editorial, trilha de auditoria e fluxo de correções.

## Estrutura

- `index.html`, `styles.css`, `app.js`: interface.
- `lib/query.mjs`: extração de números, entidades e palavras-chave.
- `lib/providers.mjs`: conectores das fontes gratuitas.
- `lib/engine.mjs`: execução paralela, ranking e deduplicação.
- `lib/topics.mjs`: assuntos e domínios oficiais.
- `search-core.js`: normalização e correspondência aproximada.
- `netlify/functions/search.mjs`: endpoint, cache e limite de requisições.
- `tests/`: testes automatizados (GitHub Actions).
- `METHODOLOGY.md`, `CONTRIBUTING.md`: critérios editoriais e contribuição.

## Licença

Ainda não foi escolhida uma licença. Até que ela seja definida, não presuma que o código pode ser redistribuído sob uma licença específica.
