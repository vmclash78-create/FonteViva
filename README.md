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
- Busca tolerante a erros comuns de digitação e correspondência aproximada.
- Filtros por veredito.
- Cartões de alegações com status, contexto e marcadores de fonte demonstrativos.
- Indicação explícita de conteúdo demonstrativo.
- Estrutura inicial para metodologia e contribuição editorial.

## Executar localmente

A interface não exige build. Os testes automatizados usam Node.js 20 ou superior.

1. Clone o repositório.
2. Abra `index.html` no navegador, ou sirva a pasta com um servidor HTTP local.
3. Para validar o código e executar os testes de busca, rode `npm run check` e `npm test`.
4. Para publicar como site estático, configure GitHub Pages para usar a branch `main` e a pasta raiz.

## Limites importantes

Esta versão **não realiza busca na web em tempo real**, não consulta bases externas automaticamente e não deve ser apresentada como um sistema de verificação automática completo. A busca atual percorre apenas os registros locais de demonstração. Integrações futuras deverão usar provedores reais, expor a origem dos dados e falhar de forma explícita quando não houver evidência suficiente.

## Próximas etapas

1. Integrar pesquisa real com fontes e links rastreáveis.
2. Criar pipeline de extração de alegações e recuperação de evidências.
3. Implementar avaliação de contradições e suporte a múltiplas fontes.
4. Criar painel editorial, trilha de auditoria e fluxo de correções.
5. Adicionar testes automatizados e verificações de segurança.
6. Desenvolver API e persistência para registros editoriais.

## Estrutura

- `index.html` — estrutura da aplicação.
- `styles.css` — design responsivo e componentes visuais.
- `search-core.js` — normalização e correspondência aproximada, compartilhadas com os testes.
- `app.js` — filtros e renderização da interface.
- `tests/search.test.mjs` — testes do núcleo de busca.
- `.github/workflows/quality.yml` — verificações automatizadas no GitHub Actions.
- `data/claims.js` — dados didáticos de demonstração.
- `METHODOLOGY.md` — critérios editoriais propostos.
- `CONTRIBUTING.md` — orientações para contribuições.

## Licença

Ainda não foi escolhida uma licença. Até que ela seja definida, não presuma que o código pode ser redistribuído sob uma licença específica.
