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

  const normalize = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Levenshtein distance: helps match small typos without pretending to understand every query.
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

  function tokenMatches(queryToken, targetToken) {
    if (targetToken.includes(queryToken) || queryToken.includes(targetToken)) return true;
    if (queryToken.length < 4 || targetToken.length < 4) return false;
    const distance = editDistance(queryToken, targetToken);
    return distance <= (Math.max(queryToken.length, targetToken.length) >= 8 ? 2 : 1);
  }

  function scoreClaim(claim, rawQuery) {
    const q = normalize(rawQuery);
    if (!q) return 1;
    const searchable = normalize([
      claim.claim, claim.summary, claim.detail,
      ...(claim.tags || []), ...(claim.sources || []).map((source) => source.label)
    ].join(" "));
    if (searchable.includes(q)) return 100;
    const queryTokens = q.split(" ").filter((token) => token.length > 1);
    const targetTokens = [...new Set(searchable.split(" "))];
    if (!queryTokens.length) return 0;
    let score = 0;
    for (const token of queryTokens) {
      if (targetTokens.some((candidate) => candidate === token)) score += 4;
      else if (targetTokens.some((candidate) => tokenMatches(token, candidate))) score += 2;
    }
    return score / queryTokens.length;
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
