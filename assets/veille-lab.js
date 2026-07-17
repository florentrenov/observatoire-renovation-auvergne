const data = window.VEILLE_DATA || { items: [], sources: [], metrics: {} };

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const pct = (value) => `${Math.round(num(value) * 100)} %`;
const emptyMessage = "Données réelles insuffisantes";

function setHtml(selector, html) {
  const node = document.querySelector(selector);
  if (node) node.innerHTML = html;
}

function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function metrics() {
  const m = data.metrics || {};
  const mem = data.memory || {};
  const activeSources = (data.sources || []).filter((source) => source.statut === "active").length;
  const collected = num(m.contenus_collectes);
  const retained = num(m.contenus_retenus);
  const pending = num(m.a_verifier);
  const queueTotal = pending + retained;
  const cards = [
    ["Sources surveillées", activeSources],
    ["Contenus collectés", collected],
    ["Signal / bruit", pct(m.ratio_signal)],
    ["Validation", mem?.taux?.validation == null ? "—" : pct(mem.taux.validation)],
    ["Rejet", mem?.taux?.rejet == null ? "—" : pct(mem.taux.rejet)],
    ["En attente", queueTotal],
  ];

  setHtml("[data-metrics]", cards.map(([label, value]) =>
    `<article><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`
  ).join(""));

  setHtml("[data-queue-summary]",
    `<strong class="queue-number">${queueTotal}</strong><p>contenus nécessitent une décision ou une vérification. ${num(data.decisionCount)} décision(s) persistée(s).</p>`
  );

  const date = m.date_calcul ? new Date(m.date_calcul) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? date.toLocaleString("fr-FR")
    : "non renseigné";
  setHtml("[data-collection-date]", `Dernier calcul : <strong>${esc(dateLabel)}</strong>`);

  setText("[data-health]", collected
    ? "État général : pipeline valide, calibration réelle en attente."
    : "État général : aucune collecte disponible."
  );

  const observed = (mem?.qualite_sources || []).filter((source) => num(source.collectes) > 0);
  const useful = [...observed]
    .filter((source) => source.taux_utilite_observe != null)
    .sort((a, b) => num(b.taux_utilite_observe) - num(a.taux_utilite_observe))
    .slice(0, 3);
  const noisy = [...observed]
    .filter((source) => source.taux_utilite_observe != null)
    .sort((a, b) => num(a.taux_utilite_observe) - num(b.taux_utilite_observe))
    .slice(0, 3);

  setHtml("[data-useful-sources]", useful.map((source) =>
    `<li>${esc(source.nom)} · ${pct(source.taux_utilite_observe)}</li>`
  ).join("") || `<li>${emptyMessage}</li>`);

  setHtml("[data-noisy-sources]", noisy.map((source) =>
    `<li>${esc(source.nom)} · utilité ${pct(source.taux_utilite_observe)}</li>`
  ).join("") || `<li>${emptyMessage}</li>`);
}

function sources(query = "") {
  const rows = (data.sources || [])
    .filter((source) => JSON.stringify(source).toLowerCase().includes(query.toLowerCase()))
    .map((source) => {
      const noise = source.niveau_bruit || (source.productivite_estimee == null
        ? "à mesurer"
        : `productivité ${source.productivite_estimee}`);
      return `<tr><td><strong>${esc(source.nom)}</strong><small>${esc(source.type_source)}</small></td><td><span class="source-level level-${esc(source.niveau_priorite)}">${esc(source.niveau_priorite)}</span></td><td>${esc(source.mode_collecte)} · ${esc(source.frequence_controle)}</td><td>${source.taux_utilite == null ? "À mesurer" : pct(source.taux_utilite)}</td><td>${esc(noise)}</td><td><span class="badge ${esc(source.statut)}">${esc(source.statut)}</span></td></tr>`;
    }).join("");
  setHtml("[data-sources]", rows || `<tr><td colspan="6">${emptyMessage}</td></tr>`);
}

function publications(status = "") {
  const items = (data.items || [])
    .filter((item) => !status || item.statut === status)
    .sort((a, b) => num(b.score_total) - num(a.score_total));
  setHtml("[data-publications]", items.map((item) =>
    `<article><div class="score">${num(item.score_total)}<small>/100</small></div><div><span class="meta">${esc(item.source_nom)} · ${esc((item.territoire || []).join(", "))}</span><h3><a href="${esc(item.url)}">${esc(item.titre_normalise)}</a></h3><div class="tag-list">${(item.categories || []).map((category) => `<span>${esc(category)}</span>`).join("")}<span class="badge ${esc(item.statut)}">${esc(item.statut)}</span></div><details><summary>Pourquoi ce score ?</summary><pre>${esc(JSON.stringify(item.score_detail || {}, null, 2))}</pre></details></div></article>`
  ).join("") || `<p class="notice">${emptyMessage}</p>`);
}

function validation() {
  const list = (data.items || []).filter((item) => ["candidat", "a_verifier"].includes(item.statut));
  setHtml("[data-validation]", list.map((item) =>
    `<article><span class="meta">${esc(item.id)} · score ${num(item.score_total)}</span><h3>${esc(item.titre_normalise)}</h3><p>${esc(item.extrait)}</p><div class="decision-actions"><button data-decision="retenu">Retenir</button><button data-decision="attente">En attente</button><button data-decision="rejete">Rejeter</button></div><output aria-live="polite"></output></article>`
  ).join("") || `<p class="notice">${emptyMessage}</p>`);

  document.querySelectorAll("[data-decision]").forEach((button) => {
    button.onclick = () => {
      const id = button.closest("article")?.querySelector(".meta")?.textContent.split(" · ")[0] || "item";
      button.closest("article").querySelector("output").textContent =
        `Simulation uniquement. Pour persister : npm.cmd run veille:decide -- ${id} ${button.dataset.decision} motif utilisateur`;
    };
  });
}

function chart() {
  const m = data.metrics || {};
  const vals = [
    ["Signal", m.ratio_signal],
    ["Doublons", m.taux_doublons],
    ["Rejets", m.taux_rejet],
  ];
  setHtml("[data-chart]", vals.map(([name, value]) =>
    `<div><span>${esc(name)}</span><i style="--value:${num(value) * 100}%"></i><strong>${pct(value)}</strong></div>`
  ).join(""));
}

document.addEventListener("DOMContentLoaded", () => {
  metrics();
  sources();
  publications();
  validation();
  chart();

  const sourceSearch = document.querySelector("[data-source-search]");
  if (sourceSearch) sourceSearch.oninput = (event) => sources(event.target.value);

  const statusFilter = document.querySelector("[data-status-filter]");
  if (statusFilter) statusFilter.onchange = (event) => publications(event.target.value);
});
