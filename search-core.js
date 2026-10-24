/* Núcleo de busca compartilhado entre a interface e os testes automatizados. */
(function (root) {
  "use strict";

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function editDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[b.length];
  }

  function tokenSimilarity(queryToken, targetToken) {
    if (queryToken === targetToken) return 1;
    if (targetToken.includes(queryToken) || queryToken.includes(targetToken)) {
      return Math.min(queryToken.length, targetToken.length) >= 3 ? 0.88 : 0;
    }
    if (queryToken.length < 4 || targetToken.length < 4) return 0;
    const distance = editDistance(queryToken, targetToken);
    const maxLength = Math.max(queryToken.length, targetToken.length);
    const allowedDistance = maxLength >= 9 ? 2 : 1;
    return distance <= allowedDistance ? 1 - distance / maxLength : 0;
  }

  function scoreText(rawQuery, rawCorpus) {
    const query = normalize(rawQuery);
    const corpus = normalize(rawCorpus);
    if (!query) return 1;
    if (!corpus) return 0;
    if (corpus.includes(query)) return 10;
    const queryTokens = query.split(" ").filter((token) => token.length > 1);
    const corpusTokens = [...new Set(corpus.split(" "))];
    if (!queryTokens.length) return 0;

    let total = 0;
    for (const token of queryTokens) {
      const best = Math.max(0, ...corpusTokens.map((candidate) => tokenSimilarity(token, candidate)));
      if (best >= 0.72) total += best;
    }
    return total / queryTokens.length;
  }

  root.FonteVivaSearch = Object.freeze({ normalize, editDistance, tokenSimilarity, scoreText });
  if (typeof module !== "undefined" && module.exports) module.exports = root.FonteVivaSearch;
})(typeof globalThis !== "undefined" ? globalThis : this);
