(() => {
  "use strict";

  const claims = Array.isArray(window.FONTEVIVA_CLAIMS) ? window.FONTEVIVA_CLAIMS : [];
  const form = document.querySelector("#search-form");
  const input = document.querySelector("#search-input");
  const list = document.querySelector("#results-list");
  const empty = document.querySelector("#empty-state");
  const count = document.querySelector("#result-count");
  const clearButton = document.querySelector("#clear-search");
  const filterButtons = [...document.querySelectorAll(".filter-tab")];
  const menuButton = document.querySelector("#menu-toggle");
  const nav = document.querySelector(".topnav");
  let query = "";
  let filter = "all";

  const searchCore = window.FonteVivaSearch;
  if (!searchCore) throw new Error("O núcleo de busca FonteViva não foi carregado.");

  function scoreClaim(claim, rawQuery) {
    const searchable = [
      claim.claim, claim.summary, claim.detail,
      ...(claim.tags || []), ...(claim.sources || []).map((source) => source.label)
    ].join(" ");
    return searchCore.scoreText(rawQuery, searchable);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function renderCard(claim) {
    const verdict = ["true", "false", "partial", "uncertain"].includes(claim.verdict) ? claim.verdict : "uncertain";
    const sources = (claim.sources || []).map((source) =>
      '<span class="source-chip">' + escapeHtml(source.label) + '</span>'
    ).join("");
    return '<article class="claim-card status-' + verdict + '">' +
      '<div class="claim-status"><span class="status-bullet"></span>' + escapeHtml(claim.verdictLabel || "Sem veredito") + '</div>' +
      '<div class="claim-content"><h3>' + escapeHtml(claim.claim) + '</h3>' +
      '<p>' + escapeHtml(claim.summary) + '</p>' +
      '<div class="claim-meta"><span>' + escapeHtml(claim.date || "Data não informada") + '</span><span class="meta-separator">/</span><span>' + escapeHtml(claim.evidence || "Nível não informado") + '</span></div>' +
      '<div class="claim-sources">' + sources + '</div></div><span class="card-arrow" aria-hidden="true">↗</span></article>';
  }

  function render() {
    const ranked = claims
      .map((claim) => ({ claim, score: scoreClaim(claim, query) }))
      .filter(({ claim, score }) => score > 0 && (filter === "all" || claim.verdict === filter))
      .sort((a, b) => b.score - a.score);
    list.innerHTML = ranked.map(({ claim }) => renderCard(claim)).join("");
    empty.hidden = ranked.length > 0;
    list.hidden = ranked.length === 0;
    count.textContent = ranked.length + (ranked.length === 1 ? " registro" : " registros");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    query = input.value;
    render();
    document.querySelector("#resultados").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  input.addEventListener("input", () => {
    if (!input.value.trim() && query) {
      query = "";
      render();
    }
  });

  filterButtons.forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.filter || "all";
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render();
  }));

  clearButton.addEventListener("click", () => {
    input.value = "";
    query = "";
    filter = "all";
    filterButtons.forEach((item) => {
      const active = item.dataset.filter === "all";
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render();
    input.focus();
  });

  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));

  render();
})();
