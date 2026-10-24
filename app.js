(() => {
  "use strict";
  const form = document.querySelector("#search-form");
  const input = document.querySelector("#search-input");
  const topicSelect = document.querySelector("#source-topic");
  const list = document.querySelector("#results-list");
  const empty = document.querySelector("#empty-state");
  const clearButton = document.querySelector("#clear-search");
  const summary = document.querySelector("#search-summary");
  const searchButton = document.querySelector("#search-button");
  let controller = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch { return ""; }
  }

  function renderResult(item) {
    const url = safeExternalUrl(item.url);
    if (!url) return "";
    const title = escapeHtml(item.title || "Resultado sem título");
    const snippet = escapeHtml(item.snippet || "O provedor não forneceu um resumo. Abra a página para conferir o conteúdo original.");
    const domain = escapeHtml(item.domain || new URL(url).hostname);
    const date = item.date ? '<span>Data: ' + escapeHtml(item.date) + '</span>' : '<span>Data não informada</span>';
    const sourceType = escapeHtml(item.sourceType || "Fonte externa");
    return '<article class="source-result">' +
      '<div class="source-result-meta"><span class="source-kind">' + sourceType + '</span><span class="source-domain">' + domain + '</span>' + date + '</div>' +
      '<h3>' + title + '</h3><p>' + snippet + '</p>' +
      '<a class="source-open" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Abrir fonte original ↗</a>' +
      '</article>';
  }

  function showError(message) {
    list.innerHTML = '<div class="search-error">' + escapeHtml(message) + '</div>';
    list.hidden = false;
    empty.hidden = true;
    summary.textContent = "A pesquisa não foi concluída.";
  }

  async function searchWeb(query, topic) {
    if (controller) controller.abort();
    controller = new AbortController();
    list.innerHTML = '<div class="search-loading">Consultando fontes externas e procurando páginas relevantes...</div>';
    list.hidden = false;
    empty.hidden = true;
    summary.textContent = "Aguarde enquanto a busca é realizada.";
    searchButton.disabled = true;
    searchButton.setAttribute("aria-busy", "true");
    try {
      const params = new URLSearchParams({ q: query, topic });
      const response = await fetch('/.netlify/functions/search?' + params.toString(), {
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "O serviço de pesquisa retornou um erro.");
      const items = Array.isArray(payload.results) ? payload.results : [];
      list.innerHTML = items.map(renderResult).filter(Boolean).join("");
      list.hidden = items.length === 0;
      empty.hidden = items.length > 0;
      summary.textContent = items.length
        ? items.length + " resultado(s) recuperado(s) por " + (payload.provider || "provedor externo") + ". Prioridade: " + (payload.topicLabel || "fontes selecionadas") + "."
        : "A pesquisa terminou sem resultados. Isso não significa que a alegação seja falsa.";
    } catch (error) {
      if (error.name === "AbortError") return;
      showError(error.message || "Não foi possível consultar a pesquisa externa.");
    } finally {
      searchButton.disabled = false;
      searchButton.removeAttribute("aria-busy");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim().slice(0, 300);
    if (!query) { input.focus(); return; }
    searchWeb(query, topicSelect.value);
    document.querySelector("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  clearButton.addEventListener("click", () => {
    if (controller) controller.abort();
    input.value = "";
    list.innerHTML = "";
    list.hidden = true;
    empty.hidden = true;
    summary.textContent = "Faça uma pesquisa para consultar documentos e páginas originais.";
    input.focus();
  });
})();