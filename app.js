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
  const menuToggle = document.querySelector("#menu-toggle");
  const mainNavigation = document.querySelector("#main-navigation");
  let controller = null;
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function safeExternalUrl(value) {
    try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""; }
    catch { return ""; }
  }
  function renderResult(item) {
    const url = safeExternalUrl(item.url);
    if (!url) return "";
    const title = escapeHtml(item.title || "Resultado sem título");
    const snippet = escapeHtml(item.snippet || "O provedor não forneceu um resumo. Abra a página para conferir o conteúdo original.");
    const domain = escapeHtml(item.domain || new URL(url).hostname);
    const date = item.date ? "<span>Data: " + escapeHtml(item.date) + "</span>" : "<span>Data não informada</span>";
    const sourceType = escapeHtml(item.sourceType || "Fonte externa");
    return '<article class="source-result"><div class="source-result-meta"><span class="source-kind">' + sourceType + '</span><span class="source-domain">' + domain + "</span>" + date + "</div>" +
      (item.numberMatch ? '<span class="source-kind">Menciona o mesmo número (não confirma a alegação)</span>' : "") +
      "<h3>" + title + "</h3><p>" + snippet + '</p><a class="source-open" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Abrir fonte original ↗</a></article>';
  }
  function describeProvider(p) {
    const name = "<strong>" + escapeHtml(p.name) + ":</strong> ";
    if (p.skipped) return "<li>" + name + "não configurada. " + escapeHtml(p.error || "") + "</li>";
    if (!p.ok) return "<li>" + name + "falhou. " + escapeHtml(p.error || "") + "</li>";
    return "<li>" + name + (p.count ? p.count + " resultado(s) recuperado(s)" : "consultada, sem resultados") + "</li>";
  }
  function showError(message) {
    list.innerHTML = '<div class="search-error">' + escapeHtml(message) + "</div>";
    list.hidden = false; empty.hidden = true; summary.textContent = "A pesquisa não foi concluída.";
  }
  async function searchWeb(query, topic) {
    if (controller) controller.abort();
    controller = new AbortController();
    list.innerHTML = '<div class="search-loading">Consultando fontes externas e procurando páginas relevantes...</div>';
    list.hidden = false; empty.hidden = true; summary.textContent = "Aguarde enquanto a busca é realizada.";
    searchButton.disabled = true; searchButton.setAttribute("aria-busy", "true");
    try {
      const params = new URLSearchParams({ q: query, topic });
      const response = await fetch("/.netlify/functions/search?" + params.toString(), { headers: { Accept: "application/json" }, signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "O serviço de pesquisa retornou um erro.");
      const items = Array.isArray(payload.results) ? payload.results : [];
      const context = Array.isArray(payload.context) ? payload.context : [];
      let html = items.map(renderResult).filter(Boolean).join("");
      if (context.length) html += '<h3 class="context-heading">Contexto (não é evidência)</h3>' + context.map(renderResult).filter(Boolean).join("");
      html += '<details class="search-notes"><summary>Como foi a busca</summary><ul>' + (payload.providers || []).map(describeProvider).join("") + "</ul>" +
        "<p>A ordem é heurística: indica proximidade com a pesquisa, não que a página confirme a afirmação. Falha de uma fonte e ausência de resultados são coisas diferentes, e nenhuma delas indica que a alegação seja falsa.</p></details>";
      list.innerHTML = html; list.hidden = false; empty.hidden = items.length + context.length > 0;
      summary.textContent = items.length ? items.length + " resultado(s) em fontes consultadas. Confira cada fonte original antes de concluir algo." : "Nenhuma fonte consultada trouxe resultados relevantes. Isso não significa que a alegação seja falsa.";
    } catch (error) {
      if (error.name === "AbortError") return;
      showError(error.message || "Não foi possível consultar a pesquisa externa.");
    } finally { searchButton.disabled = false; searchButton.removeAttribute("aria-busy"); }
  }
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute("aria-label", expanded ? "Abrir menu" : "Fechar menu");
    mainNavigation.classList.toggle("open", !expanded);
  });
  mainNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      mainNavigation.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim().slice(0, 300);
    if (!query) { input.focus(); return; }
    searchWeb(query, topicSelect.value);
    document.querySelector("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  clearButton.addEventListener("click", () => {
    if (controller) controller.abort();
    input.value = ""; list.innerHTML = ""; list.hidden = true; empty.hidden = true;
    summary.textContent = "Faça uma pesquisa para consultar documentos e páginas originais."; input.focus();
  });
})();
